import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEdit, applyBasePrice } from './productEdit.js';

test('validateEdit: só devolve os campos enviados, normalizados', () => {
  assert.deepEqual(validateEdit({ name: '  Vestido   Bella ', price: '79.9' }), { name: 'Vestido Bella', price: 79.9 });
  assert.deepEqual(validateEdit({ material: '  ', description: ' Linda ' }), { material: null, description: 'Linda' });
  assert.deepEqual(validateEdit({}), {});
});

test('validateEdit: recusa nome vazio, categoria vazia e preço inválido', () => {
  assert.throws(() => validateEdit({ name: ' ' }), /Nome obrigatório/);
  assert.throws(() => validateEdit({ category: '  ' }), /Categoria obrigatória/);
  assert.throws(() => validateEdit({ price: 0 }), /Preço inválido/);
  assert.throws(() => validateEdit({ price: 'abc' }), /Preço inválido/);
});

test('applyBasePrice: sem promoção muda price', () => {
  assert.deepEqual(applyBasePrice({ price: 50, price_original: null }, 60), { price: 60 });
});

test('applyBasePrice: em promoção muda o base e recalcula o desconto, preço promocional intacto', () => {
  assert.deepEqual(applyBasePrice({ price: 40, price_original: 65 }, 80), { price_original: 80, discount_percentage: 50 });
});

test('applyBasePrice: base não pode ficar abaixo ou igual ao preço promocional', () => {
  assert.throws(() => applyBasePrice({ price: 40, price_original: 65 }, 40), /maior que o preço promocional/);
});
