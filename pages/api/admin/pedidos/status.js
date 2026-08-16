import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { VALID_STATUSES, shouldRestoreStock, buildRestoreMap } from '../../../../lib/orderStatus';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST', details: [] } });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token ausente.', details: [] } });
  }

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Sessão inválida ou expirada.', details: [] } });
  }

  const { orderId, novoStatus } = req.body || {};
  if (!orderId || !VALID_STATUSES.includes(novoStatus)) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'orderId ou novoStatus inválido.', details: [] } });
  }

  try {
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('id', orderId)
      .single();
    if (orderErr || !order) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Pedido não encontrado.', details: [] } });
    }

    const mustRestore = shouldRestoreStock(order.status, novoStatus);

    // Update de status primeiro, condicionado ao status lido (optimistic
    // concurrency) — se outra requisição já mudou o status entre o select
    // e aqui, `updated` vem vazio e devolvemos 409 em vez de reprocessar a
    // restauração de estoque (evita restauração dupla em retry).
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({ status: novoStatus })
      .eq('id', orderId)
      .eq('status', order.status)
      .select('id');
    if (updateErr) throw updateErr;

    if (!updated || updated.length === 0) {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'Pedido foi alterado por outra requisição, tente novamente.', details: [] } });
    }

    if (mustRestore) {
      const { data: items, error: itemsErr } = await supabaseAdmin
        .from('order_items')
        .select('product_id, color_id, size_id, quantity')
        .eq('order_id', orderId);
      if (itemsErr) throw itemsErr;

      const restoreMap = buildRestoreMap(items || []);
      for (const [key, qty] of restoreMap) {
        const [productId, colorId, sizeId] = key.split(':');
        const { error: rpcErr } = await supabaseAdmin.rpc('increment_stock_quantity', {
          p_product_id: productId,
          p_color_id: colorId,
          p_size_id: sizeId,
          p_qty: qty,
        });
        if (rpcErr) throw rpcErr;
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro ao atualizar status do pedido:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível atualizar o pedido.', details: [] } });
  }
}
