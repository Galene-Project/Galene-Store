import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceCycle } from './mediaCycle.js';

test('advanceCycle: avança pro próximo índice', () => {
  assert.equal(advanceCycle(0, 3), 1);
  assert.equal(advanceCycle(1, 3), 2);
});

test('advanceCycle: dá a volta pro início depois do último item', () => {
  assert.equal(advanceCycle(2, 3), 0);
});

test('advanceCycle: lista com 1 item ou vazia sempre fica em 0', () => {
  assert.equal(advanceCycle(0, 1), 0);
  assert.equal(advanceCycle(0, 0), 0);
});
