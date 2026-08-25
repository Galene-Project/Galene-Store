import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { computeOrderItems } from '../../../lib/pricing';
import { findShortages, formatShortages } from '../../../lib/stock';

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

  const { form, cart, metodo } = req.body || {};
  if (!form || !cart?.length) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'Dados da venda incompletos.', details: [] } });
  }
  if (!['cartao', 'dinheiro', 'pix'].includes(metodo)) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'Forma de pagamento inválida.', details: [] } });
  }
  if (!form.razao?.trim() || !form.end?.trim() || !form.tel?.trim() || !form.email?.trim() || !form.email.includes('@')) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'Nome, endereço, telefone e email são obrigatórios.', details: [] } });
  }

  try {
    const productIds = [...new Set(cart.map((i) => i.id))];
    const { data: products, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('id, price')
      .eq('is_active', true)
      .in('id', productIds);
    if (prodErr) throw prodErr;

    let priced;
    try {
      priced = computeOrderItems(cart, products || []);
    } catch (e) {
      return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: e.message, details: [] } });
    }

    const { data: settingsRow } = await supabaseAdmin.from('store_settings').select('min_order').limit(1).single();
    const minOrder = settingsRow?.min_order || 6;
    const totalPecas = priced.items.reduce((s, i) => s + i.quantity, 0);
    if (totalPecas < minOrder) {
      return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: `Pedido mínimo de ${minOrder} peças.`, details: [] } });
    }

    const colorNames = [...new Set(cart.flatMap((i) => i.sel.map((s) => s.cor)))];
    const sizeNames = [...new Set(cart.flatMap((i) => i.sel.map((s) => s.tam)))];
    const [{ data: colors }, { data: sizes }] = await Promise.all([
      supabaseAdmin.from('colors').select('id,name').in('name', colorNames),
      supabaseAdmin.from('sizes').select('id,name').in('name', sizeNames),
    ]);
    const colorId = (name) => colors?.find((c) => c.name === name)?.id ?? null;
    const sizeId = (name) => sizes?.find((s) => s.name === name)?.id ?? null;

    const itensComVariante = priced.items.map((i) => ({
      productId: i.productId,
      colorId: colorId(i.cor),
      sizeId: sizeId(i.tam),
      nome: i.nome,
      cor: i.cor,
      tam: i.tam,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
    }));

    const { data: stockRows, error: stockErr } = await supabaseAdmin
      .from('stock')
      .select('product_id, color_id, size_id, quantity')
      .in('product_id', productIds);
    if (stockErr) throw stockErr;

    const faltas = findShortages(itensComVariante, stockRows || []);
    if (faltas.length > 0) {
      return res.status(409).json({
        error: { code: 'INSUFFICIENT_STOCK', message: `Estoque insuficiente: ${formatShortages(faltas)}`, details: faltas },
      });
    }

    const { data: customer, error: custErr } = await supabaseAdmin
      .from('customers')
      .insert([{
        name: form.razao.trim(),
        company_name: form.razao.trim(),
        cnpj: form.cnpj?.trim() || null,
        phone: form.tel.trim(),
        email: form.email.trim(),
      }])
      .select()
      .single();
    if (custErr) throw custErr;

    const orderNumber = `PED-${Date.now()}`;
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert([{
        order_number: orderNumber,
        customer_id: customer.id,
        payment_provider: 'presencial',
        payment_method: metodo,
        shipping_address: { endereco: form.end.trim(), cidade: form.cidade || '' },
        total: priced.total,
      }])
      .select()
      .single();
    if (orderErr) throw orderErr;

    const items = itensComVariante.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      color_id: i.colorId,
      size_id: i.sizeId,
      quantity: i.quantity,
      unit_price: i.unitPrice,
    }));
    const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(items);
    if (itemsErr) throw itemsErr;

    const { data: resultado, error: rpcErr } = await supabaseAdmin.rpc('claim_payment_and_decrement_stock', {
      p_order_id: order.id,
      p_payment_id: `presencial-${Date.now()}`,
    });
    if (rpcErr) {
      console.error('Erro ao confirmar pagamento presencial:', rpcErr);
      const ehErroDeEstoque = rpcErr.code === '23514' || (rpcErr.message || '').includes('stock row not found');
      if (ehErroDeEstoque) {
        return res.status(409).json({ error: { code: 'INSUFFICIENT_STOCK', message: 'Estoque mudou durante a venda — confira e tente novamente.', details: [] } });
      }
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível confirmar o pagamento. O pedido foi criado mas não confirmado — avise o suporte.', details: [] } });
    }

    return res.status(200).json({ order_number: orderNumber, status: resultado });
  } catch (err) {
    console.error('Erro ao registrar venda presencial:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível registrar a venda.', details: [] } });
  }
}
