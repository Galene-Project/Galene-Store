import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProductionRun, validateDistribuicao, validateProdutoBasico } from './productionRun.js';

test('validateProductionRun: calcula custo unitário arredondado em 2 casas', () => {
  const r = validateProductionRun({ custo_total: '100', quantidade_produzida: '3', data: '2026-08-21' });
  assert.equal(r.custo_total, 100);
  assert.equal(r.quantidade_produzida, 3);
  assert.equal(r.custo_unitario, 33.33);
  assert.equal(r.data, '2026-08-21');
});

test('validateProductionRun: sem data usa hoje', () => {
  const r = validateProductionRun({ custo_total: 100, quantidade_produzida: 10 });
  assert.equal(r.data, new Date().toISOString().slice(0, 10));
});

test('validateProductionRun: custo total zero ou negativo rejeita', () => {
  assert.throws(() => validateProductionRun({ custo_total: 0, quantidade_produzida: 10 }), /Custo total inválido/);
  assert.throws(() => validateProductionRun({ custo_total: -5, quantidade_produzida: 10 }), /Custo total inválido/);
});

test('validateProductionRun: quantidade não inteira ou <= 0 rejeita', () => {
  assert.throws(() => validateProductionRun({ custo_total: 100, quantidade_produzida: 0 }), /Quantidade produzida inválida/);
  assert.throws(() => validateProductionRun({ custo_total: 100, quantidade_produzida: 2.5 }), /Quantidade produzida inválida/);
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
