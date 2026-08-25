import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIAS, validateExpense, validateRecurringExpense } from './expenses.js';

test('validateExpense: aceita despesa válida e normaliza campos vazios pra null', () => {
  const r = validateExpense({ categoria: 'fixas', subcategoria: '  Aluguel  ', valor: '1500', data_competencia: '2026-08-01', data_pagamento: '', observacao: '' });
  assert.deepEqual(r, {
    categoria: 'fixas',
    subcategoria: 'Aluguel',
    valor: 1500,
    data_competencia: '2026-08-01',
    data_pagamento: null,
    observacao: null,
  });
});

test('validateExpense: categoria fora da lista fixa rejeita', () => {
  assert.throws(() => validateExpense({ categoria: 'imposto', valor: 10, data_competencia: '2026-08-01' }), /Categoria inválida/);
});

test('validateExpense: valor zero ou negativo rejeita', () => {
  assert.throws(() => validateExpense({ categoria: 'fixas', valor: 0, data_competencia: '2026-08-01' }), /Valor inválido/);
  assert.throws(() => validateExpense({ categoria: 'fixas', valor: -5, data_competencia: '2026-08-01' }), /Valor inválido/);
});

test('validateExpense: sem data de competência rejeita', () => {
  assert.throws(() => validateExpense({ categoria: 'fixas', valor: 10, data_competencia: '' }), /competência/);
});

test('validateRecurringExpense: aceita template válido, dia_geracao default 1', () => {
  const r = validateRecurringExpense({ categoria: 'pessoal', subcategoria: 'Pró-labore', valor: '3000' });
  assert.deepEqual(r, { categoria: 'pessoal', subcategoria: 'Pró-labore', valor: 3000, dia_geracao: 1 });
});

test('validateRecurringExpense: aceita dia_geracao 29/30/31 (meses sem esse dia simplesmente não geram)', () => {
  assert.equal(validateRecurringExpense({ categoria: 'fixas', valor: 10, dia_geracao: 29 }).dia_geracao, 29);
  assert.equal(validateRecurringExpense({ categoria: 'fixas', valor: 10, dia_geracao: 31 }).dia_geracao, 31);
});

test('validateRecurringExpense: dia_geracao fora de 1-31 rejeita', () => {
  assert.throws(() => validateRecurringExpense({ categoria: 'fixas', valor: 10, dia_geracao: 32 }), /Dia de geração/);
  assert.throws(() => validateRecurringExpense({ categoria: 'fixas', valor: 10, dia_geracao: 0 }), /Dia de geração/);
});

test('CATEGORIAS tem exatamente as 7 categorias fixas', () => {
  assert.deepEqual(CATEGORIAS, ['producao', 'fixas', 'pessoal', 'comissao', 'logistica', 'marketing', 'outras']);
});
