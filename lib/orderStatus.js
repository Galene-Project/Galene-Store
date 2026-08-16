export const VALID_STATUSES = [
  'aguardando_pagamento',
  'pago',
  'confirmado',
  'separado',
  'enviado',
  'cancelado',
];

// Estoque só é decrementado quando o pagamento é aprovado (ver
// pages/api/webhook-pagamento.js). Cancelar um pedido que ainda tava
// aguardando pagamento não mexe em estoque porque nunca decrementou.
export function shouldRestoreStock(statusAtual, novoStatus) {
  if (novoStatus !== 'cancelado') return false;
  if (statusAtual === 'aguardando_pagamento') return false;
  if (statusAtual === 'cancelado') return false;
  return true;
}

export function buildRestoreMap(items) {
  const map = new Map();
  for (const item of items) {
    const key = `${item.product_id}:${item.color_id}:${item.size_id}`;
    map.set(key, (map.get(key) || 0) + item.quantity);
  }
  return map;
}
