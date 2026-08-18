import { NAO_CONTA_RECEITA } from './orderStatus.js';

function startOfDay(dateStr) {
  return new Date(dateStr);
}

function endOfDay(dateStr) {
  const d = new Date(dateStr);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

export function productReport(items, orders, { productName, startDate, endDate } = {}) {
  if (!productName) {
    return { totalPecas: 0, totalReceita: 0, breakdown: [] };
  }

  const validOrderIds = new Set(
    orders
      .filter((o) => !NAO_CONTA_RECEITA.has(o.status))
      .filter((o) => {
        const created = new Date(o.created_at);
        if (startDate && created < startOfDay(startDate)) return false;
        if (endDate && created > endOfDay(endDate)) return false;
        return true;
      })
      .map((o) => o.id)
  );

  const groups = new Map();
  let totalPecas = 0;
  let totalReceita = 0;

  items
    .filter((i) => validOrderIds.has(i.order_id) && i.products?.name === productName)
    .forEach((i) => {
      const cor = i.colors?.name || '-';
      const tamanho = i.sizes?.name || '-';
      const key = `${cor}__${tamanho}`;
      const entry = groups.get(key) || { cor, tamanho, pecas: 0, receita: 0 };
      const receitaItem = i.quantity * Number(i.unit_price);
      entry.pecas += i.quantity;
      entry.receita += receitaItem;
      groups.set(key, entry);
      totalPecas += i.quantity;
      totalReceita += receitaItem;
    });

  return {
    totalPecas,
    totalReceita,
    breakdown: [...groups.values()].sort((a, b) => b.pecas - a.pecas),
  };
}
