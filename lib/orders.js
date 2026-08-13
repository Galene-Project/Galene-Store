import { supabase } from './supabaseClient';

// Grava o pedido no schema real (customers/orders/order_items) — não no
// jsonb solto que o Galene_2.0 original usava. Sem pagamento real ainda
// (Fase 2 do ROADMAP.md): isso só registra o pedido como
// "aguardando_pagamento", a Gabi confirma manualmente por fora.
export async function salvarPedido({ form, cart, pagamento, totalPecas, totalValor }) {
  const { data: customer, error: custErr } = await supabase
    .from('customers')
    .insert([{
      name: form.razao.trim(),
      company_name: form.razao.trim(),
      cnpj: form.cnpj.trim(),
      phone: form.tel.trim(),
      email: form.email.trim(),
    }])
    .select()
    .single();
  if (custErr) return { error: custErr };

  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert([{
      order_number: `PED-${Date.now()}`,
      customer_id: customer.id,
      payment_provider: pagamento,
      shipping_address: { endereco: form.end || '', cidade: form.cidade || '' },
      total: totalValor,
    }])
    .select()
    .single();
  if (orderErr) return { error: orderErr };

  const colorNames = [...new Set(cart.flatMap(i => i.sel.map(s => s.cor)))];
  const sizeNames   = [...new Set(cart.flatMap(i => i.sel.map(s => s.tam)))];
  const [{ data: colors }, { data: sizes }] = await Promise.all([
    supabase.from('colors').select('id,name').in('name', colorNames),
    supabase.from('sizes').select('id,name').in('name', sizeNames),
  ]);
  const colorId = (name) => colors?.find(c => c.name === name)?.id ?? null;
  const sizeId   = (name) => sizes?.find(s => s.name === name)?.id ?? null;

  const items = cart.flatMap(item =>
    item.sel.map(s => ({
      order_id: order.id,
      product_id: item.id,
      color_id: colorId(s.cor),
      size_id: sizeId(s.tam),
      quantity: s.qtd,
      unit_price: item.preco,
    }))
  );

  const { error: itemsErr } = await supabase.from('order_items').insert(items);
  if (itemsErr) return { error: itemsErr };

  return { data: order, error: null };
}
