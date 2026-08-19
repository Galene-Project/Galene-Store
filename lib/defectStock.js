export function validateMove({ availableQty, moveQty, defectPrice }) {
  const qty = Number(moveQty);
  if (!Number.isInteger(qty) || qty <= 0) throw new Error('Quantidade inválida.');
  if (qty > availableQty) throw new Error('Quantidade maior que o estoque disponível.');

  const preco = Number(defectPrice);
  if (!Number.isFinite(preco) || preco <= 0) throw new Error('Preço inválido.');

  return { qty, preco };
}

export function validateBaixa({ availableQty, baixaQty }) {
  const qty = Number(baixaQty);
  if (!Number.isInteger(qty) || qty <= 0) throw new Error('Quantidade inválida.');
  if (qty > availableQty) throw new Error('Quantidade maior que o disponível em defeito.');
  return qty;
}
