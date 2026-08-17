import test from 'node:test';
import assert from 'node:assert/strict';
import { productReport } from './reportMetrics.js';

function item(overrides) {
  return {
    order_id: 'o1',
    product_id: 'p1',
    quantity: 1,
    unit_price: 100,
    products: { name: 'Vestido Ana', category: 'Vestidos' },
    colors: { name: 'Azul' },
    sizes: { name: 'G' },
    ...overrides,
  };
}

function order(overrides) {
  return {
    id: 'o1',
    order_number: 'PED-0001',
    status: 'pago',
    total: 100,
    created_at: '2026-08-10T12:00:00.000Z',
    customer_id: 'c1',
    ...overrides,
  };
}

test('agrupa por cor x tamanho, somando peças e receita de múltiplos pedidos', () => {
  const orders = [order({ id: 'o1' }), order({ id: 'o2' })];
  const items = [
    item({ order_id: 'o1', quantity: 8, unit_price: 100, colors: { name: 'Azul' }, sizes: { name: 'G' } }),
    item({ order_id: 'o2', quantity: 4, unit_price: 90,  colors: { name: 'Preto' }, sizes: { name: 'M' } }),
    item({ order_id: 'o2', quantity: 6, unit_price: 100, colors: { name: 'Branco' }, sizes: { name: 'G' } }),
  ];
  const result = productReport(items, orders, { productName: 'Vestido Ana' });
  assert.equal(result.totalPecas, 18);
  assert.equal(result.totalReceita, 8 * 100 + 4 * 90 + 6 * 100);
  assert.equal(result.breakdown.length, 3);
  const azulG = result.breakdown.find((b) => b.cor === 'Azul' && b.tamanho === 'G');
  assert.equal(azulG.pecas, 8);
  assert.equal(azulG.receita, 800);
});

test('pedido aguardando_pagamento ou cancelado não entra na soma', () => {
  const orders = [
    order({ id: 'o1', status: 'aguardando_pagamento' }),
    order({ id: 'o2', status: 'cancelado' }),
    order({ id: 'o3', status: 'pago' }),
  ];
  const items = [
    item({ order_id: 'o1', quantity: 6 }),
    item({ order_id: 'o2', quantity: 6 }),
    item({ order_id: 'o3', quantity: 2 }),
  ];
  const result = productReport(items, orders, { productName: 'Vestido Ana' });
  assert.equal(result.totalPecas, 2);
});

test('filtro de período exclui pedido fora do intervalo, inclui borda exata', () => {
  const orders = [
    order({ id: 'antes',  created_at: '2026-07-31T23:59:59.000Z' }),
    order({ id: 'inicio', created_at: '2026-08-01T00:00:00.000Z' }),
    order({ id: 'fim',    created_at: '2026-08-05T23:59:00.000Z' }),
    order({ id: 'depois', created_at: '2026-08-06T00:00:01.000Z' }),
  ];
  const items = [
    item({ order_id: 'antes',  quantity: 1 }),
    item({ order_id: 'inicio', quantity: 2 }),
    item({ order_id: 'fim',    quantity: 4 }),
    item({ order_id: 'depois', quantity: 8 }),
  ];
  const result = productReport(items, orders, {
    productName: 'Vestido Ana', startDate: '2026-08-01', endDate: '2026-08-05',
  });
  assert.equal(result.totalPecas, 2 + 4);
});

test('produto sem venda no período devolve zeros e breakdown vazio', () => {
  const result = productReport([item({ order_id: 'o1' })], [order({ id: 'o1' })], { productName: 'Produto Inexistente' });
  assert.deepEqual(result, { totalPecas: 0, totalReceita: 0, breakdown: [] });
});

test('sem productName devolve zerado sem lançar erro', () => {
  const result = productReport([], [], {});
  assert.deepEqual(result, { totalPecas: 0, totalReceita: 0, breakdown: [] });
});
