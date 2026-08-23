process.env.TZ = 'America/Sao_Paulo';

import test from 'node:test';
import assert from 'node:assert/strict';
import { comparativoMensal, rankClientes, produtosParados, lucroLiquido, pontoEquilibrio, presetParaIntervalo, resumoVendas, serieFaturamento } from './dashboardMetrics.js';

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

test('rankClientes: exclui aguardando_aprovacao (cartão pendente de aprovação, ainda não pago)', () => {
  const pedidos = [
    { customerId: 'c1', nome: 'Loja A', total: 500, status: 'aguardando_aprovacao' },
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

test('lucroLiquido: subtrai custo de mercadoria e despesas do faturamento', () => {
  assert.equal(lucroLiquido({ faturamento: 10000, cogs: 4000, despesas: 3000 }), 3000);
});

test('lucroLiquido: pode dar negativo (prejuízo)', () => {
  assert.equal(lucroLiquido({ faturamento: 1000, cogs: 800, despesas: 500 }), -300);
});

test('pontoEquilibrio: faturamento ainda não cobre o fixo do mês', () => {
  const r = pontoEquilibrio(5000, 3200);
  assert.deepEqual(r, { meta: 5000, falta: 1800, coberto: false });
});

test('pontoEquilibrio: faturamento já cobre o fixo do mês', () => {
  const r = pontoEquilibrio(5000, 5000);
  assert.deepEqual(r, { meta: 5000, falta: 0, coberto: true });
});

test('pontoEquilibrio: faturamento ultrapassa o fixo, falta não fica negativa', () => {
  const r = pontoEquilibrio(5000, 8000);
  assert.deepEqual(r, { meta: 5000, falta: 0, coberto: true });
});

test('presetParaIntervalo: 7d conta os últimos 7 dias incluindo hoje', () => {
  const hoje = new Date(2026, 7, 23); // 23 ago 2026
  assert.deepEqual(presetParaIntervalo('7d', hoje), { startDate: '2026-08-17', endDate: '2026-08-23' });
});

test('presetParaIntervalo: 30d conta os últimos 30 dias incluindo hoje', () => {
  const hoje = new Date(2026, 7, 23);
  assert.deepEqual(presetParaIntervalo('30d', hoje), { startDate: '2026-07-25', endDate: '2026-08-23' });
});

test('presetParaIntervalo: 6m começa no dia 1 do mês 5 meses atrás', () => {
  const hoje = new Date(2026, 7, 23);
  assert.deepEqual(presetParaIntervalo('6m', hoje), { startDate: '2026-03-01', endDate: '2026-08-23' });
});

test('presetParaIntervalo: 12m começa no dia 1 do mês 11 meses atrás, cruzando o ano', () => {
  const hoje = new Date(2026, 7, 23);
  assert.deepEqual(presetParaIntervalo('12m', hoje), { startDate: '2025-09-01', endDate: '2026-08-23' });
});

test('resumoVendas: agrega faturamento, pedidos, ticket médio, cogs, despesas, lucro e rankings do período', () => {
  const orders = [
    { id: 'o1', created_at: '2026-08-05T10:00:00Z', status: 'pago', total: 300, customer_id: 'c1', customers: { name: 'Loja A' } },
    { id: 'o2', created_at: '2026-08-10T10:00:00Z', status: 'entregue', total: 200, customer_id: 'c1', customers: { name: 'Loja A' } },
    { id: 'o3', created_at: '2026-07-01T10:00:00Z', status: 'pago', total: 999, customer_id: 'c2', customers: { name: 'Loja B' } },
    { id: 'o4', created_at: '2026-08-12T10:00:00Z', status: 'cancelado', total: 150, customer_id: 'c1', customers: { name: 'Loja A' } },
  ];
  const paidItems = [
    { order_id: 'o1', product_id: 'p1', quantity: 3, unit_price: 100, products: { name: 'Vestido Bella', category: 'Viscolaycra' } },
    { order_id: 'o2', product_id: 'p2', quantity: 2, unit_price: 100, products: { name: 'Saia Ana', category: 'Moletinho' } },
  ];
  const custoPorProdutoId = new Map([['p1', 30], ['p2', 20]]);
  const expenses = [
    { valor: '100', data_competencia: '2026-08-01' },
    { valor: '50', data_competencia: '2026-07-01' },
  ];

  const r = resumoVendas(orders, paidItems, custoPorProdutoId, expenses, { startDate: '2026-08-01', endDate: '2026-08-31' });

  assert.equal(r.faturamento, 500);
  assert.equal(r.pedidos, 3);
  assert.equal(r.ticketMedio, Math.round(500 / 3));
  assert.equal(r.cogs, 130);
  assert.equal(r.despesas, 100);
  assert.equal(r.lucroLiquido, 500 - 130 - 100);
  assert.deepEqual(r.topProdutos[0], { nome: 'Vestido Bella', vendas: 3, receita: 300 });
  assert.equal(r.topClientes[0].nome, 'Loja A');
  assert.equal(r.topClientes[0].totalGasto, 500);
});

test('resumoVendas: período sem pedidos retorna tudo zerado, ticketMedio 0 não Infinity/NaN', () => {
  const r = resumoVendas([], [], new Map(), [], { startDate: '2026-01-01', endDate: '2026-01-31' });
  assert.deepEqual(r, { faturamento: 0, pedidos: 0, ticketMedio: 0, cogs: 0, despesas: 0, lucroLiquido: 0, topProdutos: [], vendasPorCategoria: [], topClientes: [] });
});

test('resumoVendas: startDate vazio (input limpo no seletor de período) retorna tudo zerado, não faturamento 0 + despesas cheias', () => {
  const orders = [
    { id: 'o1', created_at: '2026-08-05T10:00:00Z', status: 'pago', total: 300, customer_id: 'c1', customers: { name: 'Loja A' } },
  ];
  const expenses = [{ valor: '100', data_competencia: '2026-08-01' }];
  const r = resumoVendas(orders, [], new Map(), expenses, { startDate: '', endDate: '2026-08-31' });
  assert.deepEqual(r, { faturamento: 0, pedidos: 0, ticketMedio: 0, cogs: 0, despesas: 0, lucroLiquido: 0, topProdutos: [], vendasPorCategoria: [], topClientes: [] });
});

test('serieFaturamento: endDate vazio (input limpo no seletor de período) retorna array vazio', () => {
  const orders = [
    { created_at: '2026-08-05T10:00:00Z', status: 'pago', total: 300 },
  ];
  const r = serieFaturamento(orders, { startDate: '2026-08-01', endDate: '' });
  assert.deepEqual(r, []);
});

test('serieFaturamento: pedido de noite (horário de Brasília) não pula pro dia UTC seguinte', () => {
  // 23/08 22:00 BRT = 24/08 01:00 UTC — sem o fix, isso bucketaria como 24/08
  const orders = [
    { created_at: '2026-08-24T01:00:00Z', status: 'pago', total: 500 },
  ];
  const r = serieFaturamento(orders, { startDate: '2026-08-23', endDate: '2026-08-24' });
  assert.deepEqual(r, [{ label: '23/08', valor: 500 }]);
});

test('serieFaturamento: período curto (<=31 dias) agrupa por dia, exclui não-pagos', () => {
  const orders = [
    { created_at: '2026-08-05T10:00:00Z', status: 'pago', total: 100 },
    { created_at: '2026-08-05T15:00:00Z', status: 'entregue', total: 50 },
    { created_at: '2026-08-06T10:00:00Z', status: 'pago', total: 80 },
    { created_at: '2026-08-06T10:00:00Z', status: 'cancelado', total: 999 },
  ];
  const r = serieFaturamento(orders, { startDate: '2026-08-01', endDate: '2026-08-10' });
  assert.deepEqual(r, [
    { label: '05/08', valor: 150 },
    { label: '06/08', valor: 80 },
  ]);
});

test('serieFaturamento: período longo (>31 dias) agrupa por mês', () => {
  const orders = [
    { created_at: '2026-06-15T10:00:00Z', status: 'pago', total: 100 },
    { created_at: '2026-07-01T10:00:00Z', status: 'pago', total: 200 },
    { created_at: '2026-07-20T10:00:00Z', status: 'pago', total: 50 },
  ];
  const r = serieFaturamento(orders, { startDate: '2026-06-01', endDate: '2026-08-23' });
  assert.deepEqual(r, [
    { label: 'Jun/26', valor: 100 },
    { label: 'Jul/26', valor: 250 },
  ]);
});
