import test from 'node:test';
import assert from 'node:assert/strict';
import { VALID_STATUSES, shouldRestoreStock, buildRestoreMap } from './orderStatus.js';

test('VALID_STATUSES não inclui entregue', () => {
  assert.equal(VALID_STATUSES.includes('entregue'), false);
  assert.deepEqual(VALID_STATUSES, ['aguardando_pagamento', 'pago', 'confirmado', 'separado', 'enviado', 'cancelado']);
});

test('cancelar depois de pago devolve estoque', () => {
  assert.equal(shouldRestoreStock('pago', 'cancelado'), true);
  assert.equal(shouldRestoreStock('separado', 'cancelado'), true);
  assert.equal(shouldRestoreStock('enviado', 'cancelado'), true);
});

test('cancelar antes de pago não devolve estoque (nunca foi decrementado)', () => {
  assert.equal(shouldRestoreStock('aguardando_pagamento', 'cancelado'), false);
});

test('cancelar um pedido já cancelado não devolve de novo', () => {
  assert.equal(shouldRestoreStock('cancelado', 'cancelado'), false);
});

test('trocar pra qualquer status que não seja cancelado nunca devolve estoque', () => {
  assert.equal(shouldRestoreStock('pago', 'separado'), false);
  assert.equal(shouldRestoreStock('separado', 'enviado'), false);
});

test('buildRestoreMap soma quantidade por variante (produto+cor+tamanho)', () => {
  const items = [
    { product_id: 'p1', color_id: 'c1', size_id: 's1', quantity: 3 },
    { product_id: 'p1', color_id: 'c1', size_id: 's1', quantity: 2 },
    { product_id: 'p1', color_id: 'c2', size_id: 's1', quantity: 1 },
  ];
  const map = buildRestoreMap(items);
  assert.equal(map.get('p1:c1:s1'), 5);
  assert.equal(map.get('p1:c2:s1'), 1);
  assert.equal(map.size, 2);
});

test('buildRestoreMap com lista vazia retorna Map vazio', () => {
  assert.equal(buildRestoreMap([]).size, 0);
});
