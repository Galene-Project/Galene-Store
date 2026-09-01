import { NAO_CONTA_RECEITA } from './orderStatus.js';

const MS_POR_DIA = 24 * 60 * 60 * 1000;

export function periodoValido(startDate, endDate) {
  return Boolean(startDate) && Boolean(endDate)
    && !Number.isNaN(new Date(startDate).getTime())
    && !Number.isNaN(new Date(endDate).getTime());
}

function pctVariacao(atual, anterior) {
  if (!anterior) return null;
  return Math.round(((atual - anterior) / anterior) * 100);
}

export function comparativoMensal(atual, anterior) {
  return {
    faturamentoPct: pctVariacao(atual.valor, anterior.valor),
    pedidosPct: pctVariacao(atual.pedidos, anterior.pedidos),
  };
}

export function rankClientes(pedidos, limite = 10) {
  const porCliente = new Map();
  for (const p of pedidos) {
    if (NAO_CONTA_RECEITA.has(p.status)) continue;
    const entry = porCliente.get(p.customerId) || { nome: p.nome, totalGasto: 0, totalPedidos: 0 };
    entry.totalGasto += p.total;
    entry.totalPedidos += 1;
    porCliente.set(p.customerId, entry);
  }
  return [...porCliente.values()]
    .sort((a, b) => b.totalGasto - a.totalGasto)
    .slice(0, limite);
}

export function produtosParados(vendas, diasLimite = 60, agora = new Date()) {
  return vendas
    .filter((v) => {
      if (!v.ultimaVenda) return true;
      const dias = Math.floor((agora - v.ultimaVenda) / MS_POR_DIA);
      return dias >= diasLimite;
    })
    .map((v) => ({
      produto: v.produto,
      estoqueTotal: v.estoqueTotal,
      diasSemVenda: v.ultimaVenda ? Math.floor((agora - v.ultimaVenda) / MS_POR_DIA) : null,
    }));
}

export function lucroLiquido({ faturamento, cogs, despesas }) {
  return faturamento - cogs - despesas;
}

export function pontoEquilibrio(despesaFixaMensal, faturamentoMesCorrente) {
  const falta = despesaFixaMensal - faturamentoMesCorrente;
  return { meta: despesaFixaMensal, falta: Math.max(0, falta), coberto: falta <= 0 };
}

const MESES_ABREV = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

export function endOfDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999);
}

export function presetParaIntervalo(preset, hoje = new Date()) {
  const endDate = toISODate(hoje);

  if (preset === '7d') {
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - 6);
    return { startDate: toISODate(inicio), endDate };
  }
  if (preset === '30d') {
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - 29);
    return { startDate: toISODate(inicio), endDate };
  }
  if (preset === '12m') {
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1);
    return { startDate: toISODate(inicio), endDate };
  }
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
  return { startDate: toISODate(inicio), endDate };
}

export function resumoVendas(orders, paidItems, custoPorProdutoId, expenses, { startDate, endDate }) {
  if (!periodoValido(startDate, endDate)) {
    return { faturamento: 0, pedidos: 0, ticketMedio: 0, cogs: 0, despesas: 0, lucroLiquido: 0, topProdutos: [], vendasPorCategoria: [], topClientes: [] };
  }
  const inicio = startOfDay(startDate);
  const fim = endOfDay(endDate);

  const pedidosPeriodo = orders.filter((o) => {
    const d = new Date(o.created_at);
    return d >= inicio && d <= fim;
  });

  const pedidosPagos = pedidosPeriodo.filter((o) => !NAO_CONTA_RECEITA.has(o.status));
  const pedidosPagosIds = new Set(pedidosPagos.map((o) => o.id));

  const faturamento = pedidosPagos.reduce((s, o) => s + Number(o.total || 0), 0);
  const pedidos = pedidosPeriodo.length;
  const ticketMedio = pedidos ? Math.round(faturamento / pedidos) : 0;

  const itensPeriodo = paidItems.filter((i) => pedidosPagosIds.has(i.order_id));
  const cogs = itensPeriodo.reduce((s, i) => s + i.quantity * (custoPorProdutoId.get(i.product_id) || 0), 0);

  const prodMap = new Map();
  const catMap = new Map();
  itensPeriodo.forEach((i) => {
    const pname = i.products?.name || '—';
    const pEntry = prodMap.get(pname) || { nome: pname, vendas: 0, receita: 0 };
    pEntry.vendas += i.quantity;
    pEntry.receita += i.quantity * Number(i.unit_price);
    prodMap.set(pname, pEntry);

    const cat = i.products?.category || 'Outros';
    const cEntry = catMap.get(cat) || { nome: cat, vendas: 0, receita: 0 };
    cEntry.vendas += i.quantity;
    cEntry.receita += i.quantity * Number(i.unit_price);
    catMap.set(cat, cEntry);
  });

  const despesas = expenses
    .filter((e) => e.data_competencia >= startDate && e.data_competencia <= endDate)
    .reduce((s, e) => s + Number(e.valor), 0);

  const topClientes = rankClientes(
    pedidosPeriodo.map((o) => ({
      customerId: o.customer_id,
      nome: o.customers?.company_name || o.customers?.name || '—',
      total: Number(o.total || 0),
      status: o.status,
    }))
  );

  return {
    faturamento,
    pedidos,
    ticketMedio,
    cogs,
    despesas,
    lucroLiquido: lucroLiquido({ faturamento, cogs, despesas }),
    topProdutos: [...prodMap.values()].sort((a, b) => b.vendas - a.vendas).slice(0, 7),
    vendasPorCategoria: [...catMap.values()].sort((a, b) => b.receita - a.receita),
    topClientes,
  };
}

export function serieFaturamento(orders, { startDate, endDate }) {
  if (!periodoValido(startDate, endDate)) return [];
  const inicio = startOfDay(startDate);
  const fim = endOfDay(endDate);
  const diffDias = Math.round((fim - inicio) / MS_POR_DIA);
  const porDia = diffDias <= 31;

  const pedidosPeriodo = orders.filter((o) => {
    const d = new Date(o.created_at);
    return d >= inicio && d <= fim && !NAO_CONTA_RECEITA.has(o.status);
  });

  const buckets = new Map();
  pedidosPeriodo.forEach((o) => {
    const d = new Date(o.created_at);
    const key = porDia
      ? toISODate(d)
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets.set(key, (buckets.get(key) || 0) + Number(o.total || 0));
  });

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, valor]) => ({
      label: porDia
        ? `${key.slice(8, 10)}/${key.slice(5, 7)}`
        : `${MESES_ABREV[Number(key.slice(5, 7)) - 1]}/${key.slice(2, 4)}`,
      valor,
    }));
}
