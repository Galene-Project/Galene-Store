import { Preference } from 'mercadopago';
import { mpClient } from '../../lib/mercadopago';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { computeOrderItems } from '../../lib/pricing';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST', details: [] } });

  const { form, cart, pagamento } = req.body || {};

  if (!form || !cart?.length) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'Dados do pedido incompletos.', details: [] } });
  }

  try {
    // Preço vem sempre do banco, nunca do corpo do POST — ver lib/pricing.js.
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

    // Peças mínimas recalculadas do carrinho de verdade — não confia no
    // totalPecas que o client mandava (dava pra declarar 6 e mandar 1).
    const totalPecas = priced.items.reduce((s, i) => s + i.quantity, 0);
    if (totalPecas < 6) {
      return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'Pedido mínimo de 6 peças.', details: [] } });
    }

    const { data: customer, error: custErr } = await supabaseAdmin
      .from('customers')
      .insert([{
        name: form.razao?.trim(),
        company_name: form.razao?.trim(),
        cnpj: form.cnpj?.trim(),
        phone: form.tel?.trim(),
        email: form.email?.trim(),
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
        payment_provider: 'mercado_pago',
        shipping_address: { endereco: form.end || '', cidade: form.cidade || '' },
        total: priced.total,
      }])
      .select()
      .single();
    if (orderErr) throw orderErr;

    const colorNames = [...new Set(cart.flatMap((i) => i.sel.map((s) => s.cor)))];
    const sizeNames = [...new Set(cart.flatMap((i) => i.sel.map((s) => s.tam)))];
    const [{ data: colors }, { data: sizes }] = await Promise.all([
      supabaseAdmin.from('colors').select('id,name').in('name', colorNames),
      supabaseAdmin.from('sizes').select('id,name').in('name', sizeNames),
    ]);
    const colorId = (name) => colors?.find((c) => c.name === name)?.id ?? null;
    const sizeId = (name) => sizes?.find((s) => s.name === name)?.id ?? null;

    const items = priced.items.map((i) => ({
      order_id: order.id,
      product_id: i.productId,
      color_id: colorId(i.cor),
      size_id: sizeId(i.tam),
      quantity: i.quantity,
      unit_price: i.unitPrice,
    }));
    const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(items);
    if (itemsErr) throw itemsErr;

    const origin = `https://${req.headers.host}`;
    const preference = new Preference(mpClient);
    const pref = await preference.create({
      body: {
        items: priced.items.map((i) => ({
          title: `${i.nome} — ${i.cor}/${i.tam}`,
          quantity: i.quantity,
          unit_price: i.unitPrice,
          currency_id: 'BRL',
        })),
        external_reference: order.id,
        back_urls: {
          success: `${origin}/pedido-confirmado?numero=${orderNumber}`,
          pending: `${origin}/pedido-confirmado?numero=${orderNumber}`,
          failure: `${origin}/`,
        },
        auto_return: 'approved',
        notification_url: `${origin}/api/webhook-pagamento`,
      },
    });

    await supabaseAdmin.from('orders').update({ payment_id: pref.id }).eq('id', order.id);

    return res.status(200).json({ order_number: orderNumber, checkout_url: pref.init_point });
  } catch (err) {
    console.error('Erro ao criar pedido:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível criar o pedido.', details: [] } });
  }
}
