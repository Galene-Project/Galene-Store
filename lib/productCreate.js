export function validateNewProduct({ name, category, price, variants }) {
  if (!name || !name.trim()) throw new Error('Nome obrigatório.');
  if (!category || !category.trim()) throw new Error('Categoria obrigatória.');

  const precoNum = Number(price);
  if (!Number.isFinite(precoNum) || precoNum <= 0) throw new Error('Preço inválido.');

  if (!Array.isArray(variants) || variants.length === 0) {
    throw new Error('Adicione ao menos uma variante de cor/tamanho.');
  }

  const seen = new Set();
  for (const v of variants) {
    if (!v.color_id || !v.size_id) throw new Error('Cor e tamanho obrigatórios em cada variante.');
    const key = `${v.color_id}:${v.size_id}`;
    if (seen.has(key)) throw new Error('Variante duplicada (mesma cor e tamanho).');
    seen.add(key);

    const qty = Number(v.quantity);
    if (!Number.isInteger(qty) || qty < 0) throw new Error('Quantidade de estoque inválida.');
  }

  return { name: name.trim(), category: category.trim(), price: precoNum, variants };
}
