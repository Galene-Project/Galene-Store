export const VALID_STATUSES = [
  'aguardando_aprovacao',
  'aguardando_pagamento',
  'pago',
  'confirmado',
  'separado',
  'enviado',
  'cancelado',
];

// Status que não contam como receita/venda nas métricas (dashboard,
// relatórios). aguardando_aprovacao é pedido de cartão ainda não
// aprovado nem pago — não pode entrar em faturamento/ranking/etc.
export const NAO_CONTA_RECEITA = new Set(['aguardando_aprovacao', 'aguardando_pagamento', 'cancelado']);

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
