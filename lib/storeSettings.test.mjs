import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMinOrder } from './storeSettings.js';

test('aceita inteiro >= 1', () => {
  assert.equal(validateMinOrder(6), 6);
  assert.equal(validateMinOrder(1), 1);
  assert.equal(validateMinOrder('12'), 12);
});

test('rejeita zero, negativo, fracionário ou não numérico', () => {
  assert.throws(() => validateMinOrder(0), /inteiro/);
  assert.throws(() => validateMinOrder(-3), /inteiro/);
  assert.throws(() => validateMinOrder(2.5), /inteiro/);
  assert.throws(() => validateMinOrder('abc'), /inteiro/);
  assert.throws(() => validateMinOrder(null), /inteiro/);
});
