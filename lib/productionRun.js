export function validateProductionRun({ custo_itens, quantidade_produzida, data }) {
  const itensValidos = (Array.isArray(custo_itens) ? custo_itens : [])
    .map((item) => ({ label: (item?.label || '').trim(), valorNum: Number(item?.valor) }))
    .filter((item) => Number.isFinite(item.valorNum) && item.valorNum > 0)
    .map((item) => {
      if (!item.label) throw new Error('Nome do item de custo obrigatório.');
      return { label: item.label, valor: item.valorNum };
    });

  const custoTotalBruto = itensValidos.reduce((soma, item) => soma + item.valor, 0);
  const custoTotal = Math.round(custoTotalBruto * 100) / 100;
  if (custoTotal <= 0) throw new Error('Custo total inválido.');

  const qtdNum = Number(quantidade_produzida);
  if (!Number.isInteger(qtdNum) || qtdNum <= 0) throw new Error('Quantidade produzida inválida.');

  return {
    custo_total: custoTotal,
    custo_itens: itensValidos,
    quantidade_produzida: qtdNum,
    data: data || new Date().toISOString().slice(0, 10),
    custo_unitario: Math.round((custoTotal / qtdNum) * 100) / 100,
  };
}

const CATEGORIAS_PADRAO_CUSTO = ['Tecido', 'Costura', 'Aviamento', 'Defeitos', 'Extras'];

// ponytail: chips não normalizam case/acento ("tecido" != "Tecido") e só olham os
// últimos 100 lotes (limit(100) em action:"listar" de pages/api/admin/lotes.js) —
// teto aceitável pro volume atual da Galene, revisar se crescer.
export function chipsDeLotes(lotes) {
  const usados = new Set(CATEGORIAS_PADRAO_CUSTO);
  const extras = [];
  (lotes || []).forEach((l) => {
    const custoItens = Array.isArray(l?.custo_itens) ? l.custo_itens : [];
    custoItens.forEach((item) => {
      if (item?.label && !usados.has(item.label)) {
        usados.add(item.label);
        extras.push(item.label);
      }
    });
  });
  return [...CATEGORIAS_PADRAO_CUSTO, ...extras.sort((a, b) => a.localeCompare(b))];
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
