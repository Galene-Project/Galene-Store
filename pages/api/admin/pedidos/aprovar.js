import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { createOrderPreference } from '../../../../lib/mercadopagoPreference';

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

  const { orderId } = req.body || {};
  if (!orderId) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'orderId inválido.', details: [] } });
  }

  try {
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, status')
      .eq('id', orderId)
      .single();
    if (orderErr || !order) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Pedido não encontrado.', details: [] } });
    }
    if (order.status !== 'aguardando_aprovacao') {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'Pedido não está aguardando aprovação.', details: [] } });
    }

    const { data: orderItems, error: itemsErr } = await supabaseAdmin
      .from('order_items')
      .select('quantity, unit_price, products(name), colors(name), sizes(name)')
      .eq('order_id', orderId);
    if (itemsErr) throw itemsErr;

    const items = (orderItems || []).map((i) => ({
      nome: i.products?.name || '—',
      cor: i.colors?.name || '-',
      tam: i.sizes?.name || '-',
      quantity: i.quantity,
      unitPrice: Number(i.unit_price),
    }));

    const origin = `https://${req.headers.host}`;
    const pref = await createOrderPreference(order, items, origin);

    // CAS: só grava se o pedido ainda estiver aguardando_aprovacao — se
    // outro operador aprovou primeiro entre a leitura acima e este
    // update, essa condição falha e devolvemos 409 em vez de gerar dois
    // links pro mesmo pedido.
    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({ status: 'aguardando_pagamento', payment_id: pref.id })
      .eq('id', orderId)
      .eq('status', 'aguardando_aprovacao')
      .select()
      .single();
    if (updateErr || !updated) {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'Pedido foi alterado por outra requisição, tente novamente.', details: [] } });
    }

    return res.status(200).json({ checkout_url: pref.init_point });
  } catch (err) {
    console.error('Erro ao aprovar pedido:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível aprovar o pedido.', details: [] } });
  }
}
