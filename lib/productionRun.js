export function validateProductionRun({ custo_total, quantidade_produzida, data }) {
  const custoNum = Number(custo_total);
  if (!Number.isFinite(custoNum) || custoNum <= 0) throw new Error('Custo total inválido.');

  const qtdNum = Number(quantidade_produzida);
  if (!Number.isInteger(qtdNum) || qtdNum <= 0) throw new Error('Quantidade produzida inválida.');

  return {
    custo_total: custoNum,
    quantidade_produzida: qtdNum,
    data: data || new Date().toISOString().slice(0, 10),
    custo_unitario: Math.round((custoNum / qtdNum) * 100) / 100,
  };
}

export function validateDistribuicao(distribuicao, disponivel) {
  if (!Array.isArray(distribuicao) || distribuicao.length === 0) {
    throw new Error('Informe ao menos uma variante pra distribuir.');
  }

  let total = 0;
  for (const d of distribuicao) {
    if (!d.color_id || !d.size_id) throw new Error('Cor e tamanho obrigatórios em cada linha.');
    const qty = Number(d.quantity);
    if (!Number.isInteger(qty) || qty <= 0) throw new Error('Quantidade inválida em uma das linhas.');
    total += qty;
  }

  if (total > disponivel) {
    throw new Error(`Total distribuído (${total}) maior que o disponível no lote (${disponivel}).`);
  }

  return total;
}

export function validateProdutoBasico({ name, category, price }) {
  if (!name || !name.trim()) throw new Error('Nome obrigatório.');
  if (!category || !category.trim()) throw new Error('Categoria obrigatória.');

  const precoNum = Number(price);
  if (!Number.isFinite(precoNum) || precoNum <= 0) throw new Error('Preço inválido.');

  return { name: name.trim(), category: category.trim(), price: precoNum };
}
