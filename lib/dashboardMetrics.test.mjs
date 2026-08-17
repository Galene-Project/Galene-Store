import test from 'node:test';
import assert from 'node:assert/strict';
import { comparativoMensal, rankClientes, produtosParados } from './dashboardMetrics.js';

test('comparativoMensal: mês atual maior que anterior → up, percentual correto', () => {
  const r = comparativoMensal({ valor: 1200, pedidos: 12 }, { valor: 1000, pedidos: 10 });
  assert.equal(r.faturamentoPct, 20);
  assert.equal(r.pedidosPct, 20);
});

test('comparativoMensal: mês atual menor que anterior → percentual negativo', () => {
  const r = comparativoMensal({ valor: 800, pedidos: 8 }, { valor: 1000, pedidos: 10 });
  assert.equal(r.faturamentoPct, -20);
  assert.equal(r.pedidosPct, -20);
});

test('comparativoMensal: mês anterior zero → null, não Infinity', () => {
  const r = comparativoMensal({ valor: 500, pedidos: 5 }, { valor: 0, pedidos: 0 });
  assert.equal(r.faturamentoPct, null);
  assert.equal(r.pedidosPct, null);
});

test('rankClientes: soma total por cliente com múltiplos pedidos', () => {
  const pedidos = [
    { customerId: 'c1', nome: 'Loja A', total: 300, status: 'pago' },
    { customerId: 'c1', nome: 'Loja A', total: 200, status: 'entregue' },
    { customerId: 'c2', nome: 'Loja B', total: 100, status: 'pago' },
  ];
  const r = rankClientes(pedidos);
  assert.deepEqual(r[0], { nome: 'Loja A', totalGasto: 500, totalPedidos: 2 });
  assert.deepEqual(r[1], { nome: 'Loja B', totalGasto: 100, totalPedidos: 1 });
});

test('rankClientes: exclui aguardando_pagamento e cancelado', () => {
  const pedidos = [
    { customerId: 'c1', nome: 'Loja A', total: 500, status: 'aguardando_pagamento' },
    { customerId: 'c1', nome: 'Loja A', total: 300, status: 'cancelado' },
    { customerId: 'c1', nome: 'Loja A', total: 100, status: 'pago' },
  ];
  const r = rankClientes(pedidos);
  assert.equal(r.length, 1);
  assert.equal(r[0].totalGasto, 100);
});

test('rankClientes: corta no limite e ordena desc', () => {
  const pedidos = [
    { customerId: 'c1', nome: 'A', total: 10, status: 'pago' },
    { customerId: 'c2', nome: 'B', total: 30, status: 'pago' },
    { customerId: 'c3', nome: 'C', total: 20, status: 'pago' },
  ];
  const r = rankClientes(pedidos, 2);
  assert.equal(r.length, 2);
  assert.deepEqual(r.map((c) => c.nome), ['B', 'C']);
});

test('produtosParados: vendido há 30 dias com limite 60 → fora da lista', () => {
  const agora = new Date('2026-08-17T12:00:00Z');
  const vendas = [{ produto: 'Vestido Bella', ultimaVenda: new Date('2026-07-18T12:00:00Z'), estoqueTotal: 10 }];
  assert.deepEqual(produtosParados(vendas, 60, agora), []);
});

test('produtosParados: vendido há 90 dias → dentro da lista, diasSemVenda correto', () => {
  const agora = new Date('2026-08-17T12:00:00Z');
  const vendas = [{ produto: 'Vestido Bella', ultimaVenda: new Date('2026-05-19T12:00:00Z'), estoqueTotal: 10 }];
  const r = produtosParados(vendas, 60, agora);
  assert.equal(r.length, 1);
  assert.equal(r[0].diasSemVenda, 90);
});

test('produtosParados: nunca vendido → dentro da lista, diasSemVenda null', () => {
  const agora = new Date('2026-08-17T12:00:00Z');
  const vendas = [{ produto: 'Vestido Novo', ultimaVenda: null, estoqueTotal: 5 }];
  const r = produtosParados(vendas, 60, agora);
  assert.equal(r.length, 1);
  assert.equal(r[0].diasSemVenda, null);
});
