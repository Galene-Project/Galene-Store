export const VALID_STATUSES = [
  'aguardando_aprovacao',
  'aguardando_pagamento',
  'pago',
  'confirmado',
  'separado',
  'enviado',
  'cancelado',
];

// Estoque só é decrementado quando o pagamento é aprovado (ver
// pages/api/webhook-pagamento.js). Cancelar um pedido que ainda tava
// aguardando aprovação ou aguardando pagamento não mexe em estoque
// porque nunca decrementou.
export function shouldRestoreStock(statusAtual, novoStatus) {
  if (novoStatus !== 'cancelado') return false;
  if (statusAtual === 'aguardando_aprovacao') return false;
  if (statusAtual === 'aguardando_pagamento') return false;
  if (statusAtual === 'cancelado') return false;
  return true;
}
