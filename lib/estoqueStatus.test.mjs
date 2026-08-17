import test from 'node:test';
import assert from 'node:assert/strict';
import { corBaixa, corEsgotada } from './estoqueStatus.js';

test('cor com um tamanho baixo e outro ok: corBaixa true, corEsgotada false', () => {
  const status = { M: 'baixo', G: 'ok' };
  assert.equal(corBaixa(status), true);
  assert.equal(corEsgotada(status), false);
});

test('cor com todos os tamanhos esgotados: corEsgotada true, corBaixa false', () => {
  const status = { M: 'esgotado', G: 'esgotado' };
  assert.equal(corEsgotada(status), true);
  assert.equal(corBaixa(status), false);
});

test('cor com um tamanho esgotado e outro ok: nenhum dos dois (o botão do tamanho já avisa)', () => {
  const status = { M: 'esgotado', G: 'ok' };
  assert.equal(corBaixa(status), false);
  assert.equal(corEsgotada(status), false);
});

test('cor com tudo ok: nenhum dos dois', () => {
  const status = { M: 'ok', G: 'ok' };
  assert.equal(corBaixa(status), false);
  assert.equal(corEsgotada(status), false);
});

test('cor com um único tamanho baixo: corBaixa true', () => {
  assert.equal(corBaixa({ Unico: 'baixo' }), true);
});

test('objeto vazio: nenhum dos dois (sem tamanho visível pra essa cor)', () => {
  assert.equal(corBaixa({}), false);
  assert.equal(corEsgotada({}), false);
});
