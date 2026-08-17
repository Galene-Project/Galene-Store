import test from 'node:test';
import assert from 'node:assert/strict';
import { VALID_STATUSES, shouldRestoreStock } from './orderStatus.js';

test('VALID_STATUSES não inclui entregue', () => {
  assert.equal(VALID_STATUSES.includes('entregue'), false);
  assert.deepEqual(VALID_STATUSES, ['aguardando_aprovacao', 'aguardando_pagamento', 'pago', 'confirmado', 'separado', 'enviado', 'cancelado']);
});

test('cancelar depois de pago devolve estoque', () => {
  assert.equal(shouldRestoreStock('pago', 'cancelado'), true);
  assert.equal(shouldRestoreStock('separado', 'cancelado'), true);
  assert.equal(shouldRestoreStock('enviado', 'cancelado'), true);
});

test('cancelar antes de pago não devolve estoque (nunca foi decrementado)', () => {
  assert.equal(shouldRestoreStock('aguardando_pagamento', 'cancelado'), false);
});

test('cancelar pedido aguardando aprovação não devolve estoque (nunca foi decrementado)', () => {
  assert.equal(shouldRestoreStock('aguardando_aprovacao', 'cancelado'), false);
});

test('cancelar um pedido já cancelado não devolve de novo', () => {
  assert.equal(shouldRestoreStock('cancelado', 'cancelado'), false);
});

test('trocar pra qualquer status que não seja cancelado nunca devolve estoque', () => {
  assert.equal(shouldRestoreStock('pago', 'separado'), false);
  assert.equal(shouldRestoreStock('separado', 'enviado'), false);
});
