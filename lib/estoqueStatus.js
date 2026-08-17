export function corBaixa(statusPorTamanho) {
  return Object.values(statusPorTamanho).includes('baixo');
}

export function corEsgotada(statusPorTamanho) {
  const valores = Object.values(statusPorTamanho);
  return valores.length > 0 && valores.every((v) => v === 'esgotado');
}
