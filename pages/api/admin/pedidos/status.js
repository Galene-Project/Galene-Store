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

    if (shouldRestoreStock(order.status, novoStatus)) {
      const { data: items, error: itemsErr } = await supabaseAdmin
        .from('order_items')
        .select('product_id, color_id, size_id, quantity')
        .eq('order_id', orderId);
      if (itemsErr) throw itemsErr;

      const restoreMap = buildRestoreMap(items || []);
      for (const [key, qty] of restoreMap) {
        const [productId, colorId, sizeId] = key.split(':');
        const { data: stockRow } = await supabaseAdmin
          .from('stock')
          .select('id, quantity')
          .eq('product_id', productId)
          .eq('color_id', colorId)
          .eq('size_id', sizeId)
          .single();
        if (stockRow) {
          await supabaseAdmin
            .from('stock')
            .update({ quantity: stockRow.quantity + qty })
            .eq('id', stockRow.id);
        }
      }
    }

    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({ status: novoStatus })
      .eq('id', orderId);
    if (updateErr) throw updateErr;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro ao atualizar status do pedido:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível atualizar o pedido.', details: [] } });
  }
}
