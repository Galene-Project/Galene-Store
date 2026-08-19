export function computePromotion(currentPrice, currentPriceOriginal, novoPreco) {
  const preco = Number(novoPreco);
  if (!Number.isFinite(preco) || preco <= 0) {
    throw new Error('Preço promocional inválido.');
  }

  const anchor = currentPriceOriginal != null ? currentPriceOriginal : currentPrice;

  if (preco >= anchor) {
    throw new Error('Preço promocional precisa ser menor que o preço original.');
  }

  const discount_percentage = Math.round((1 - preco / anchor) * 100);

  return {
    price: preco,
    price_original: anchor,
    discount_percentage,
  };
}
