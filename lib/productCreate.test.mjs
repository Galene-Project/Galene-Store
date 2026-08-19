import test from 'node:test';
import assert from 'node:assert/strict';
import { validateNewProduct } from './productCreate.js';

test('aceita produto válido com variantes', () => {
  const result = validateNewProduct({
    name: '  Vestido Nova  ',
    category: 'Viscolaycra',
    price: '99.90',
    variants: [{ color_id: 'c1', size_id: 's1', quantity: 5 }],
  });
  assert.equal(result.name, 'Vestido Nova');
  assert.equal(result.category, 'Viscolaycra');
  assert.equal(result.price, 99.9);
});

test('rejeita nome vazio', () => {
  assert.throws(() => validateNewProduct({ name: '  ', category: 'X', price: 10, variants: [{ color_id: 'c1', size_id: 's1', quantity: 1 }] }));
});

test('rejeita preço inválido', () => {
  assert.throws(() => validateNewProduct({ name: 'X', category: 'Y', price: 0, variants: [{ color_id: 'c1', size_id: 's1', quantity: 1 }] }));
  assert.throws(() => validateNewProduct({ name: 'X', category: 'Y', price: 'abc', variants: [{ color_id: 'c1', size_id: 's1', quantity: 1 }] }));
});

test('rejeita sem variantes', () => {
  assert.throws(() => validateNewProduct({ name: 'X', category: 'Y', price: 10, variants: [] }));
});

test('rejeita variante duplicada', () => {
  assert.throws(() => validateNewProduct({
    name: 'X', category: 'Y', price: 10,
    variants: [{ color_id: 'c1', size_id: 's1', quantity: 1 }, { color_id: 'c1', size_id: 's1', quantity: 2 }],
  }));
});

test('rejeita quantidade negativa ou fracionária', () => {
  assert.throws(() => validateNewProduct({ name: 'X', category: 'Y', price: 10, variants: [{ color_id: 'c1', size_id: 's1', quantity: -1 }] }));
  assert.throws(() => validateNewProduct({ name: 'X', category: 'Y', price: 10, variants: [{ color_id: 'c1', size_id: 's1', quantity: 1.5 }] }));
});
