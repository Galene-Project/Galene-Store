import test from 'node:test';
import assert from 'node:assert/strict';
import { computePromotion } from './catalogPromotion.js';

test('liga promoção pela primeira vez — ancora price_original no preço corrente', () => {
  const result = computePromotion(60, null, 40);
  assert.deepEqual(result, { price: 40, price_original: 60, discount_percentage: 33 });
});

test('edita promoção já ativa — price_original não muda', () => {
  const result = computePromotion(40, 60, 30);
  assert.deepEqual(result, { price: 30, price_original: 60, discount_percentage: 50 });
});

test('preço novo maior ou igual ao original lança erro', () => {
  assert.throws(() => computePromotion(60, null, 60), /menor que o preço original/);
  assert.throws(() => computePromotion(40, 60, 65), /menor que o preço original/);
});

test('preço novo zero, negativo ou não numérico lança erro', () => {
  assert.throws(() => computePromotion(60, null, 0), /inválido/);
  assert.throws(() => computePromotion(60, null, -5), /inválido/);
  assert.throws(() => computePromotion(60, null, NaN), /inválido/);
});
