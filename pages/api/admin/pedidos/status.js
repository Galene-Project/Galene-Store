import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { VALID_STATUSES, shouldRestoreStock } from '../../../../lib/orderStatus';

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

    // Status update + restauração de estoque (se houver) rodam dentro de
    // uma única função Postgres (`update_order_status_and_restore_stock`),
    // que o Postgres executa numa única transação implícita — se faltar
    // linha de estoque no meio da restauração, tudo é revertido, inclusive
    // o update de status já feito antes na mesma função. Isso fecha a
    // janela de falha parcial (status commitado + estoque parcialmente
    // restaurado) que existia com as duas operações separadas.
    const { data: result, error: rpcErr } = await supabaseAdmin.rpc('update_order_status_and_restore_stock', {
      p_order_id: orderId,
      p_expected_status: order.status,
      p_novo_status: novoStatus,
      p_must_restore: mustRestore,
    });
    if (rpcErr) throw rpcErr;

    if (result === 'conflict') {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'Pedido foi alterado por outra requisição, tente novamente.', details: [] } });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro ao atualizar status do pedido:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível atualizar o pedido.', details: [] } });
  }
}
