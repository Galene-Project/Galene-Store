import test from 'node:test';
import assert from 'node:assert/strict';
import { findShortages } from './stock.js';

const item = (over = {}) => ({
  productId: 'p1', colorId: 'c1', sizeId: 's1',
  nome: 'Vestido Bella', cor: 'Preto', tam: 'M', quantity: 6,
  ...over,
});
const stock = (over = {}) => ({
  product_id: 'p1', color_id: 'c1', size_id: 's1', quantity: 10, ...over,
});

test('estoque suficiente não acusa falta', () => {
  assert.deepEqual(findShortages([item()], [stock()]), []);
});

test('estoque exato (pedido == disponível) passa', () => {
  assert.deepEqual(findShortages([item({ quantity: 10 })], [stock({ quantity: 10 })]), []);
});

test('pedido acima do estoque acusa falta com os números', () => {
  const faltas = findShortages([item({ quantity: 6 })], [stock({ quantity: 3 })]);
  assert.equal(faltas.length, 1);
  assert.deepEqual(faltas[0], {
    nome: 'Vestido Bella', cor: 'Preto', tam: 'M', pedido: 6, disponivel: 3,
  });
});

test('variante sem linha de estoque conta como zero disponível', () => {
  const faltas = findShortages([item()], []);
  assert.equal(faltas.length, 1);
  assert.equal(faltas[0].disponivel, 0);
});

// O caso que passa despercebido: o mesmo par cor/tamanho aparecendo duas vezes
// no carrinho. Conferido linha a linha, 3 e 3 cabem em 5; somados, não cabem.
test('mesma variante repetida no carrinho é somada antes de comparar', () => {
  const faltas = findShortages(
    [item({ quantity: 3 }), item({ quantity: 3 })],
    [stock({ quantity: 5 })],
  );
  assert.equal(faltas.length, 1);
  assert.equal(faltas[0].pedido, 6);
  assert.equal(faltas[0].disponivel, 5);
});

test('variantes diferentes do mesmo produto são avaliadas separadamente', () => {
  const faltas = findShortages(
    [item({ sizeId: 's1', tam: 'M', quantity: 4 }),
     item({ sizeId: 's2', tam: 'G', quantity: 9 })],
    [stock({ size_id: 's1', quantity: 10 }),
     stock({ size_id: 's2', quantity: 2 })],
  );
  assert.equal(faltas.length, 1);
  assert.equal(faltas[0].tam, 'G');
  assert.equal(faltas[0].disponivel, 2);
});

// `stock.color_id` é nullable e no Postgres `col = NULL` nunca casa — a linha
// de estoque de uma variante sem cor precisa casar mesmo assim.
test('variante com cor nula casa com a linha de estoque de cor nula', () => {
  assert.deepEqual(
    findShortages([item({ colorId: null, cor: '-' })], [stock({ color_id: null })]),
    [],
  );
});

test('acusa todas as faltas de uma vez, não só a primeira', () => {
  const faltas = findShortages(
    [item({ productId: 'p1', quantity: 6 }), item({ productId: 'p2', nome: 'Blusa Caja', quantity: 6 })],
    [stock({ product_id: 'p1', quantity: 1 }), stock({ product_id: 'p2', quantity: 2 })],
  );
  assert.equal(faltas.length, 2);
  assert.deepEqual(faltas.map((f) => f.disponivel), [1, 2]);
});
