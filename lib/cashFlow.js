import { periodoValido, startOfDay, endOfDay } from './dashboardMetrics.js';
import { CATEGORIA_LABEL } from './expenses.js';

export function fluxoCaixa(orders, expenses, productionRuns, { startDate, endDate }) {
  if (!periodoValido(startDate, endDate)) {
    return { movimentos: [], totalEntrada: 0, totalSaida: 0, saldo: 0, saidaPorCategoria: [] };
  }

  const inicio = startOfDay(startDate);
  const fim = endOfDay(endDate);
  const movimentos = [];

  orders
    .filter((o) => o.paid_at && new Date(o.paid_at) >= inicio && new Date(o.paid_at) <= fim)
    .forEach((o) => {
      movimentos.push({
        data: o.paid_at,
        tipo: 'entrada',
        categoria: 'Venda',
        descricao: `${o.order_number} — ${o.customers?.company_name || o.customers?.name || '—'}`,
        valor: Number(o.total || 0),
      });
    });

  expenses
    .filter((e) => e.data_pagamento && e.data_pagamento >= startDate && e.data_pagamento <= endDate)
    .forEach((e) => {
      const label = CATEGORIA_LABEL[e.categoria] || e.categoria;
      movimentos.push({
        data: e.data_pagamento,
        tipo: 'saida',
        categoria: label,
        descricao: e.subcategoria || label,
        valor: Number(e.valor),
      });
    });

  productionRuns
    .filter((p) => p.data && p.data >= startDate && p.data <= endDate)
    .forEach((p) => {
      movimentos.push({
        data: p.data,
        tipo: 'saida',
        categoria: 'Produção (lote)',
        descricao: p.products?.name || '—',
        valor: Number(p.custo_total || 0),
      });
    });

  movimentos.sort((a, b) => new Date(b.data) - new Date(a.data));

  const totalEntrada = movimentos.filter((m) => m.tipo === 'entrada').reduce((s, m) => s + m.valor, 0);
  const totalSaida = movimentos.filter((m) => m.tipo === 'saida').reduce((s, m) => s + m.valor, 0);

  const porCategoria = new Map();
  movimentos.filter((m) => m.tipo === 'saida').forEach((m) => {
    porCategoria.set(m.categoria, (porCategoria.get(m.categoria) || 0) + m.valor);
  });
  const saidaPorCategoria = [...porCategoria.entries()]
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);

  return { movimentos, totalEntrada, totalSaida, saldo: totalEntrada - totalSaida, saidaPorCategoria };
}
