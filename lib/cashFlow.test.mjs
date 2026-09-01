process.env.TZ = 'America/Sao_Paulo';

import test from 'node:test';
import assert from 'node:assert/strict';
import { fluxoCaixa } from './cashFlow.js';

const periodo = { startDate: '2026-08-01', endDate: '2026-08-31' };

test('fluxoCaixa: período inválido retorna tudo zerado', () => {
  const r = fluxoCaixa([], [], [], { startDate: null, endDate: null });
  assert.deepEqual(r, { movimentos: [], totalEntrada: 0, totalSaida: 0, saldo: 0, saidaPorCategoria: [] });
});

test('fluxoCaixa: pedido pago dentro do período vira entrada', () => {
  const orders = [
    { id: 'o1', order_number: 'PED-0001', total: 300, paid_at: '2026-08-10T12:00:00Z', customers: { name: 'Loja A' } },
    { id: 'o2', order_number: 'PED-0002', total: 500, paid_at: '2026-07-30T12:00:00Z', customers: { name: 'Loja B' } },
    { id: 'o3', order_number: 'PED-0003', total: 100, paid_at: null, customers: { name: 'Loja C' } },
  ];
  const r = fluxoCaixa(orders, [], [], periodo);
  assert.equal(r.totalEntrada, 300);
  assert.equal(r.movimentos.length, 1);
  assert.equal(r.movimentos[0].tipo, 'entrada');
  assert.equal(r.movimentos[0].valor, 300);
});

test('fluxoCaixa: despesa sem data_pagamento (pendente) não entra', () => {
  const expenses = [
    { categoria: 'fixas', subcategoria: 'Aluguel', valor: 600, data_pagamento: '2026-08-05' },
    { categoria: 'fixas', subcategoria: 'Luz', valor: 150, data_pagamento: null },
  ];
  const r = fluxoCaixa([], expenses, [], periodo);
  assert.equal(r.totalSaida, 600);
  assert.equal(r.movimentos.length, 1);
});

test('fluxoCaixa: custo de lote conta como saída', () => {
  const productionRuns = [
    { custo_total: 1200, data: '2026-08-15', products: { name: 'Vestido Bella' } },
    { custo_total: 800, data: '2026-07-01', products: { name: 'Vestido Nina' } },
  ];
  const r = fluxoCaixa([], [], productionRuns, periodo);
  assert.equal(r.totalSaida, 1200);
  assert.equal(r.movimentos[0].categoria, 'Produção (lote)');
});

test('fluxoCaixa: saldo é entrada menos saída', () => {
  const orders = [{ id: 'o1', order_number: 'PED-0001', total: 1000, paid_at: '2026-08-10T12:00:00Z', customers: {} }];
  const expenses = [{ categoria: 'fixas', subcategoria: 'Aluguel', valor: 400, data_pagamento: '2026-08-05' }];
  const r = fluxoCaixa(orders, expenses, [], periodo);
  assert.equal(r.saldo, 600);
});

test('fluxoCaixa: saidaPorCategoria agrupa e ordena do maior pro menor', () => {
  const expenses = [
    { categoria: 'fixas', subcategoria: 'Aluguel', valor: 600, data_pagamento: '2026-08-05' },
    { categoria: 'logistica', subcategoria: 'Combustível', valor: 100, data_pagamento: '2026-08-06' },
    { categoria: 'fixas', subcategoria: 'Luz', valor: 200, data_pagamento: '2026-08-07' },
  ];
  const r = fluxoCaixa([], expenses, [], periodo);
  assert.deepEqual(r.saidaPorCategoria, [
    { categoria: 'Fixas', valor: 800 },
    { categoria: 'Logística', valor: 100 },
  ]);
});

test('fluxoCaixa: movimentos ordenados por data decrescente', () => {
  const expenses = [
    { categoria: 'fixas', subcategoria: 'Aluguel', valor: 600, data_pagamento: '2026-08-05' },
    { categoria: 'fixas', subcategoria: 'Luz', valor: 200, data_pagamento: '2026-08-20' },
  ];
  const r = fluxoCaixa([], expenses, [], periodo);
  assert.equal(r.movimentos[0].data, '2026-08-20');
  assert.equal(r.movimentos[1].data, '2026-08-05');
});
