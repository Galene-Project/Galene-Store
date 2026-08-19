import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMove, validateBaixa } from './defectStock.js';

test('validateMove aceita quantidade dentro do disponível', () => {
  const result = validateMove({ availableQty: 10, moveQty: 3, defectPrice: 29.9 });
  assert.equal(result.qty, 3);
  assert.equal(result.preco, 29.9);
});

test('validateMove rejeita quantidade maior que disponível', () => {
  assert.throws(() => validateMove({ availableQty: 2, moveQty: 3, defectPrice: 10 }));
});

test('validateMove rejeita quantidade zero/negativa/fracionária', () => {
  assert.throws(() => validateMove({ availableQty: 10, moveQty: 0, defectPrice: 10 }));
  assert.throws(() => validateMove({ availableQty: 10, moveQty: -1, defectPrice: 10 }));
  assert.throws(() => validateMove({ availableQty: 10, moveQty: 1.5, defectPrice: 10 }));
});

test('validateMove rejeita preço inválido', () => {
  assert.throws(() => validateMove({ availableQty: 10, moveQty: 1, defectPrice: 0 }));
  assert.throws(() => validateMove({ availableQty: 10, moveQty: 1, defectPrice: 'abc' }));
});

test('validateBaixa aceita quantidade dentro do disponível', () => {
  assert.equal(validateBaixa({ availableQty: 5, baixaQty: 5 }), 5);
});

test('validateBaixa rejeita quantidade maior que disponível ou inválida', () => {
  assert.throws(() => validateBaixa({ availableQty: 5, baixaQty: 6 }));
  assert.throws(() => validateBaixa({ availableQty: 5, baixaQty: 0 }));
});
