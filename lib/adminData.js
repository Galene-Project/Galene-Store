import { supabase } from './supabaseClient';
import { comparativoMensal, rankClientes, produtosParados as calcProdutosParados } from './dashboardMetrics';

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export const STATUS_LABEL = {
  aguardando_pagamento: 'Pendente',
  pago: 'Pago',
  confirmado: 'Confirmado',
  separado: 'Separado',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

function last6Months() {
  const out = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ year: d.getFullYear(), month: d.getMonth(), label: MESES[d.getMonth()] });
  }
  return out;
}

// Busca tudo do Supabase e monta o mesmo formato que o mockData.js usava,
// pra não precisar reescrever Overview/Vendas/Estoque/Pedidos.jsx.
// Fase 3 do ROADMAP.md — tudo aqui é dado real; se estiver zerado é
// porque ainda não tem pedido nenhum no banco, não é bug.
export async function fetchDashboardData() {
  const [ordersRes, itemsRes, stockRes, productsRes] = await Promise.all([
    supabase.from('orders').select('id, order_number, status, total, created_at, customer_id, customers(name, company_name)'),
    supabase.from('order_items').select('order_id, product_id, quantity, unit_price, products(name, category), colors(name), sizes(name)'),
    supabase.from('stock').select('quantity, min_threshold, products(sku, name, category), colors(name), sizes(name)'),
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  const orders = ordersRes.data || [];
  const items = itemsRes.data || [];
  const stock = stockRes.data || [];
  const totalSkus = productsRes.count || 0;

  const disponiveis = stock.filter((s) => s.quantity > 0).length;
  const esgotados = stock.filter((s) => s.quantity <= 0).length;
  const estoqueBaixo = stock.filter((s) => s.quantity > 0 && s.quantity <= s.min_threshold).length;

  const estoqueAlertas = stock
    .filter((s) => s.quantity <= s.min_threshold)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 12)
    .map((s) => ({
      sku: s.products?.sku || '',
      produto: s.products?.name || '',
      cor: s.colors?.name || '-',
      tam: s.sizes?.name || '-',
      real: s.quantity,
      minimo: s.min_threshold,
      status: s.quantity <= 0 ? 'esgotado' : 'baixo',
    }));

  const NAO_CONTA_RECEITA = new Set(['aguardando_pagamento', 'cancelado']);
  const faturamentoMensal = last6Months().map(({ year, month, label }) => {
    const doMes = orders.filter((o) => {
      const d = new Date(o.created_at);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    const pagos = doMes.filter((o) => !NAO_CONTA_RECEITA.has(o.status));
    return {
      mes: label,
      valor: pagos.reduce((s, o) => s + Number(o.total || 0), 0),
      pedidos: doMes.length,
    };
  });

  const pedidosMes = faturamentoMensal.reduce((a, b) => a + b.pedidos, 0);
  const entregues = orders.filter((o) => o.status === 'entregue').length;
  const cancelados = orders.filter((o) => o.status === 'cancelado').length;
  const emAndamento = orders.filter((o) => !['entregue', 'cancelado'].includes(o.status)).length;

  const hojeStr = new Date().toDateString();
  const pedidosHojeArr = orders.filter((o) => new Date(o.created_at).toDateString() === hojeStr);

  const paidOrderIds = new Set(orders.filter((o) => !NAO_CONTA_RECEITA.has(o.status)).map((o) => o.id));
  const paidItems = items.filter((i) => paidOrderIds.has(i.order_id));

  const catMap = new Map();
  const prodMap = new Map();
  const sizeMap = new Map();
  let totalPecasVendidas = 0;

  paidItems.forEach((i) => {
    const cat = i.products?.category || 'Outros';
    const catEntry = catMap.get(cat) || { nome: cat, vendas: 0, receita: 0 };
    catEntry.vendas += i.quantity;
    catEntry.receita += i.quantity * Number(i.unit_price);
    catMap.set(cat, catEntry);

    const pname = i.products?.name || '—';
    const prodEntry = prodMap.get(pname) || { nome: pname, vendas: 0, receita: 0 };
    prodEntry.vendas += i.quantity;
    prodEntry.receita += i.quantity * Number(i.unit_price);
    prodMap.set(pname, prodEntry);

    const sname = i.sizes?.name || '-';
    sizeMap.set(sname, (sizeMap.get(sname) || 0) + i.quantity);
    totalPecasVendidas += i.quantity;
  });

  const itemsByOrder = new Map();
  items.forEach((i) => {
    if (!itemsByOrder.has(i.order_id)) itemsByOrder.set(i.order_id, []);
    itemsByOrder.get(i.order_id).push(i);
  });

  const ultimosPedidos = [...orders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 20)
    .map((o) => {
      const its = itemsByOrder.get(o.id) || [];
      const first = its[0];
      return {
        id: o.id,
        num: o.order_number,
        data: new Date(o.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        cliente: o.customers?.name || '—',
        produto: first ? (its.length > 1 ? `${first.products?.name} +${its.length - 1}` : first.products?.name) : '—',
        cor: first?.colors?.name || '-',
        tam: first?.sizes?.name || '-',
        qtd: its.reduce((s, i) => s + i.quantity, 0),
        total: Number(o.total || 0),
        status: STATUS_LABEL[o.status] || o.status,
        statusRaw: o.status,
        itens: its.map((i) => ({
          produto: i.products?.name || '—',
          cor: i.colors?.name || '-',
          tam: i.sizes?.name || '-',
          quantidade: i.quantity,
          precoUnit: Number(i.unit_price || 0),
        })),
      };
    });

  const comparativo = comparativoMensal(faturamentoMensal[5], faturamentoMensal[4]);

  const topClientes = rankClientes(
    orders.map((o) => ({
      customerId: o.customer_id,
      nome: o.customers?.company_name || o.customers?.name || '—',
      total: Number(o.total || 0),
      status: o.status,
    }))
  );

  const ordersById = new Map(orders.map((o) => [o.id, o]));
  const ultimaVendaPorProduto = new Map();
  paidItems.forEach((i) => {
    const nome = i.products?.name || '—';
    const pedido = ordersById.get(i.order_id);
    if (!pedido) return;
    const data = new Date(pedido.created_at);
    const atual = ultimaVendaPorProduto.get(nome);
    if (!atual || data > atual) ultimaVendaPorProduto.set(nome, data);
  });

  const estoqueTotalPorProduto = new Map();
  const estoqueCatMap = new Map();
  stock.forEach((s) => {
    const nome = s.products?.name || '—';
    estoqueTotalPorProduto.set(nome, (estoqueTotalPorProduto.get(nome) || 0) + s.quantity);
    const cat = s.products?.category || 'Outros';
    estoqueCatMap.set(cat, (estoqueCatMap.get(cat) || 0) + s.quantity);
  });

  const produtosParadosCompleto = calcProdutosParados(
    [...estoqueTotalPorProduto.entries()]
      .filter(([, estoqueTotal]) => estoqueTotal > 0)
      .map(([produto, estoqueTotal]) => ({
        produto,
        estoqueTotal,
        ultimaVenda: ultimaVendaPorProduto.get(produto) || null,
      }))
  ).sort((a, b) => b.estoqueTotal - a.estoqueTotal);
  const produtosParadosTotal = produtosParadosCompleto.length;
  const produtosParadosLista = produtosParadosCompleto.slice(0, 12);

  const estoquePorCategoria = [...estoqueCatMap.entries()]
    .map(([nome, estoque]) => ({ nome, estoque }))
    .sort((a, b) => b.estoque - a.estoque);

  return {
    orders,
    items,
    faturamentoMensal,
    vendasPorCategoria: [...catMap.values()].sort((a, b) => b.receita - a.receita),
    topProdutos: [...prodMap.values()].sort((a, b) => b.vendas - a.vendas).slice(0, 7),
    estoqueAlertas,
    distribuicaoTamanho: [...sizeMap.entries()].map(([name, qty]) => ({
      name,
      value: totalPecasVendidas ? Math.round((qty / totalPecasVendidas) * 100) : 0,
    })),
    ultimosPedidos,
    comparativo,
    topClientes,
    produtosParados: produtosParadosLista,
    produtosParadosTotal,
    estoquePorCategoria,
    kpis: {
      totalSkus, disponiveis, estoqueBaixo, esgotados,
      pedidosHoje: pedidosHojeArr.length,
      faturamentoHoje: pedidosHojeArr.reduce((s, o) => s + Number(o.total || 0), 0),
      pedidosMes, cancelados, emAndamento, entregues,
    },
  };
}
