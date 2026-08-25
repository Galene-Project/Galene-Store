export const CATEGORIAS = ['producao', 'fixas', 'pessoal', 'comissao', 'logistica', 'marketing', 'outras'];

export const CATEGORIA_LABEL = {
  producao: 'Produção',
  fixas: 'Fixas',
  pessoal: 'Pessoal',
  comissao: 'Comissão',
  logistica: 'Logística',
  marketing: 'Marketing',
  outras: 'Outras',
};

export const SUBCATEGORIA_SUGESTOES = {
  producao: ['Tecido', 'Costureira', 'Insumo avulso'],
  fixas: ['Aluguel', 'Estacionamento', 'Luz', 'Internet/Telefone', 'Assinaturas'],
  pessoal: ['Salário', 'Pró-labore'],
  comissao: ['Venda'],
  logistica: ['Frete/Entrega'],
  marketing: ['Fotos', 'Anúncio'],
  outras: ['Manutenção de equipamento'],
};

export function validateExpense({ categoria, subcategoria, valor, data_competencia, data_pagamento, observacao }) {
  if (!CATEGORIAS.includes(categoria)) throw new Error('Categoria inválida.');

  const valorNum = Number(valor);
  if (!Number.isFinite(valorNum) || valorNum <= 0) throw new Error('Valor inválido.');

  if (!data_competencia) throw new Error('Data de competência obrigatória.');

  return {
    categoria,
    subcategoria: subcategoria?.trim() || null,
    valor: valorNum,
    data_competencia,
    data_pagamento: data_pagamento || null,
    observacao: observacao?.trim() || null,
  };
}

export function validateRecurringExpense({ categoria, subcategoria, valor, dia_geracao }) {
  if (!CATEGORIAS.includes(categoria)) throw new Error('Categoria inválida.');

  const valorNum = Number(valor);
  if (!Number.isFinite(valorNum) || valorNum <= 0) throw new Error('Valor inválido.');

  const dia = dia_geracao == null || dia_geracao === '' ? 1 : Number(dia_geracao);
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) throw new Error('Dia de geração deve ser entre 1 e 31.');

  return {
    categoria,
    subcategoria: subcategoria?.trim() || null,
    valor: valorNum,
    dia_geracao: dia,
  };
}
