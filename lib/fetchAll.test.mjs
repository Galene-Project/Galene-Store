import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchAll } from './fetchAll.js';

const fakeTable = (n) => Array.from({ length: n }, (_, i) => ({ id: i }));
const build = (table) => async (from, to) => ({ data: table.slice(from, to + 1), error: null });

test('fetchAll: junta várias páginas', async () => {
  const { data, error } = await fetchAll(build(fakeTable(25)), 10);
  assert.equal(error, null);
  assert.equal(data.length, 25);
  assert.equal(data[24].id, 24);
});

test('fetchAll: tabela com múltiplo exato do tamanho da página não perde nem repete linha', async () => {
  const { data } = await fetchAll(build(fakeTable(20)), 10);
  assert.equal(data.length, 20);
});

test('fetchAll: tabela vazia', async () => {
  const { data } = await fetchAll(build([]), 10);
  assert.deepEqual(data, []);
});

test('fetchAll: erro em qualquer página aborta e devolve o erro', async () => {
  const falha = async (from) => (from === 0 ? { data: fakeTable(10), error: null } : { data: null, error: new Error('x') });
  const { data, error } = await fetchAll(falha, 10);
  assert.equal(data, null);
  assert.equal(error.message, 'x');
});
