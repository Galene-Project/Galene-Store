import test from 'node:test';
import assert from 'node:assert/strict';
import { formatBRL, formatBRLk } from './format.js';

test('formatBRL: positivo, zero e negativo com sinal antes do símbolo', () => {
  assert.equal(formatBRL(1234.5), 'R$1.234,50');
  assert.equal(formatBRL(0), 'R$0,00');
  assert.equal(formatBRL(-1234.5), '-R$1.234,50');
});

test('formatBRLk: compacta a partir de mil, com sinal antes do símbolo', () => {
  assert.equal(formatBRLk(5100), 'R$5.1k');
  assert.equal(formatBRLk(-15900), '-R$15.9k');
  assert.equal(formatBRLk(1000), 'R$1.0k');
});

test('formatBRLk: abaixo de mil mostra valor cheio', () => {
  assert.equal(formatBRLk(950), 'R$950,00');
  assert.equal(formatBRLk(-400), '-R$400,00');
  assert.equal(formatBRLk(0), 'R$0,00');
});
