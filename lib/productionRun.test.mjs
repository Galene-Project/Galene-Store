import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProductionRun, validateDistribuicao, validateProdutoBasico, chipsDeLotes } from './productionRun.js';

test('validateProductionRun: soma itens válidos e calcula custo unitário arredondado em 2 casas', () => {
  const r = validateProductionRun({
    custo_itens: [{ label: 'Tecido', valor: '60' }, { label: 'Costura', valor: '40' }],
    quantidade_produzida: '3',
    data: '2026-08-21',
  });
  assert.equal(r.custo_total, 100);
  assert.deepEqual(r.custo_itens, [{ label: 'Tecido', valor: 60 }, { label: 'Costura', valor: 40 }]);
  assert.equal(r.quantidade_produzida, 3);
  assert.equal(r.custo_unitario, 33.33);
  assert.equal(r.data, '2026-08-21');
});

test('validateProductionRun: sem data usa hoje', () => {
  const r = validateProductionRun({ custo_itens: [{ label: 'Tecido', valor: 100 }], quantidade_produzida: 10 });
  assert.equal(r.data, new Date().toISOString().slice(0, 10));
});

test('validateProductionRun: linha com valor vazio é descartada sem erro', () => {
  const r = validateProductionRun({
    custo_itens: [{ label: 'Tecido', valor: '60' }, { label: 'Defeitos', valor: '' }],
    quantidade_produzida: 3,
  });
  assert.equal(r.custo_total, 60);
  assert.deepEqual(r.custo_itens, [{ label: 'Tecido', valor: 60 }]);
});

test('validateProductionRun: linha com valor zero ou negativo é descartada sem erro', () => {
  const r = validateProductionRun({
    custo_itens: [{ label: 'Tecido', valor: 60 }, { label: 'Costura', valor: 0 }, { label: 'Extras', valor: -5 }],
    quantidade_produzida: 3,
  });
  assert.deepEqual(r.custo_itens, [{ label: 'Tecido', valor: 60 }]);
});

test('validateProductionRun: linha com valor válido e label vazio rejeita', () => {
  assert.throws(
    () => validateProductionRun({ custo_itens: [{ label: '', valor: 60 }], quantidade_produzida: 3 }),
    /Nome do item de custo obrigatório/,
  );
  assert.throws(
    () => validateProductionRun({ custo_itens: [{ label: '   ', valor: 60 }], quantidade_produzida: 3 }),
    /Nome do item de custo obrigatório/,
  );
});

test('validateProductionRun: nenhuma linha válida rejeita', () => {
  assert.throws(() => validateProductionRun({ custo_itens: [], quantidade_produzida: 10 }), /Custo total inválido/);
  assert.throws(
    () => validateProductionRun({ custo_itens: [{ label: 'Tecido', valor: '' }], quantidade_produzida: 10 }),
    /Custo total inválido/,
  );
});

test('validateProductionRun: quantidade não inteira ou <= 0 rejeita', () => {
  assert.throws(
    () => validateProductionRun({ custo_itens: [{ label: 'Tecido', valor: 100 }], quantidade_produzida: 0 }),
    /Quantidade produzida inválida/,
  );
  assert.throws(
    () => validateProductionRun({ custo_itens: [{ label: 'Tecido', valor: 100 }], quantidade_produzida: 2.5 }),
    /Quantidade produzida inválida/,
  );
});

test('validateDistribuicao: soma dentro do disponível passa e retorna o total', () => {
  const total = validateDistribuicao([{ color_id: 'c1', size_id: 's1', quantity: 5 }, { color_id: 'c1', size_id: 's2', quantity: 3 }], 10);
  assert.equal(total, 8);
});

test('validateDistribuicao: soma maior que o disponível rejeita', () => {
  assert.throws(() => validateDistribuicao([{ color_id: 'c1', size_id: 's1', quantity: 11 }], 10), /maior que o disponível/);
});

test('validateDistribuicao: linha vazia rejeita', () => {
  assert.throws(() => validateDistribuicao([], 10), /ao menos uma variante/);
});

test('validateDistribuicao: linha sem cor ou tamanho rejeita', () => {
  assert.throws(() => validateDistribuicao([{ color_id: '', size_id: 's1', quantity: 2 }], 10), /obrigatórios/);
});

test('validateProdutoBasico: aceita produto válido e normaliza espaços', () => {
  const r = validateProdutoBasico({ name: '  Vestido Nova  ', category: ' Viscolaycra ', price: '129.9' });
  assert.deepEqual(r, { name: 'Vestido Nova', category: 'Viscolaycra', price: 129.9 });
});

test('validateProdutoBasico: sem nome rejeita', () => {
  assert.throws(() => validateProdutoBasico({ name: '', category: 'X', price: 10 }), /Nome obrigatório/);
});

test('chipsDeLotes: array vazio retorna só os 5 padrão', () => {
  assert.deepEqual(chipsDeLotes([]), ['Tecido', 'Costura', 'Aviamento', 'Defeitos', 'Extras']);
});

test('chipsDeLotes: item customizado vira chip extra', () => {
  const r = chipsDeLotes([{ custo_itens: [{ label: 'Frete', valor: 10 }] }]);
  assert.deepEqual(r, ['Tecido', 'Costura', 'Aviamento', 'Defeitos', 'Extras', 'Frete']);
});

test('chipsDeLotes: nome duplicado (padrão ou repetido em dois lotes) não duplica', () => {
  const r = chipsDeLotes([
    { custo_itens: [{ label: 'Tecido', valor: 10 }, { label: 'Frete', valor: 5 }] },
    { custo_itens: [{ label: 'Frete', valor: 7 }] },
  ]);
  assert.deepEqual(r, ['Tecido', 'Costura', 'Aviamento', 'Defeitos', 'Extras', 'Frete']);
});

test('chipsDeLotes: custo_itens que não é array não quebra', () => {
  assert.deepEqual(chipsDeLotes([{ custo_itens: null }, { custo_itens: {} }, { custo_itens: 'x' }]),
    ['Tecido', 'Costura', 'Aviamento', 'Defeitos', 'Extras']);
  assert.deepEqual(chipsDeLotes(null), ['Tecido', 'Costura', 'Aviamento', 'Defeitos', 'Extras']);
});
