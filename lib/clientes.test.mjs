process.env.TZ = 'America/Sao_Paulo';

import test from 'node:test';
import assert from 'node:assert/strict';
import { resumoClientes, filtrarClientes, whatsappLink, clientesParaCsv } from './clientes.js';

const agora = new Date('2026-10-20T12:00:00-03:00');
const customers = [
  { id: 'c1', name: 'Ana', company_name: 'Loja Ana', phone: '11988887777', email: 'ana@x.com' },
  { id: 'c2', name: 'Bia', phone: '11977776666', email: '' },
  { id: 'c3', name: 'Cris', phone: '11966665555', email: 'cris@x.com' },
];
const orders = [
  { customer_id: 'c1', status: 'entregue', total: 100, created_at: '2026-06-01T12:00:00-03:00' },
  { customer_id: 'c1', status: 'pago', total: 50, created_at: '2026-10-10T12:00:00-03:00', paid_at: '2026-10-11T12:00:00-03:00' },
  { customer_id: 'c1', status: 'cancelado', total: 999, created_at: '2026-10-15T12:00:00-03:00' },
  { customer_id: 'c2', status: 'confirmado', total: 80, created_at: '2026-07-01T12:00:00-03:00' },
  { customer_id: 'c2', status: 'aguardando_pagamento', total: 70, created_at: '2026-10-01T12:00:00-03:00' },
];

test('resumoClientes: conta só pedido real, soma gasto e acha a última compra', () => {
  const [a, b, c] = resumoClientes(customers, orders, agora);
  assert.equal(a.nome, 'Loja Ana');
  assert.equal(a.compras, 2);
  assert.equal(a.gasto, 150);
  assert.equal(a.ultimaCompra, '2026-10-11');
  assert.equal(a.diasSemComprar, 9);
  assert.equal(b.compras, 1);
  assert.equal(b.diasSemComprar, 111);
  assert.equal(c.compras, 0);
  assert.equal(c.ultimaCompra, null);
  assert.equal(c.diasSemComprar, null);
});

test('filtrarClientes: recorrentes, inativos, sem compra, sem e-mail', () => {
  const rows = resumoClientes(customers, orders, agora);
  const ids = (f) => filtrarClientes(rows, f).map((r) => r.id);
  assert.deepEqual(ids({ segmento: 'recorrentes' }), ['c1']);
  assert.deepEqual(ids({ segmento: 'inativos' }), ['c2']);
  assert.deepEqual(ids({ segmento: 'sem_compra' }), ['c3']);
  assert.deepEqual(ids({ segmento: 'sem_email' }), ['c2']);
});

test('filtrarClientes: busca por nome, e-mail e telefone mascarado', () => {
  const rows = resumoClientes(customers, orders, agora);
  const ids = (busca) => filtrarClientes(rows, { busca }).map((r) => r.id);
  assert.deepEqual(ids('ana'), ['c1']);
  assert.deepEqual(ids('cris@x'), ['c3']);
  assert.deepEqual(ids('(11) 97777'), ['c2']);
  assert.deepEqual(ids('zzz'), []);
});

test('whatsappLink: adiciona DDI 55 em número BR sem DDI, mantém quem já tem, null se curto', () => {
  assert.equal(whatsappLink('11988887777'), 'https://wa.me/5511988887777');
  assert.equal(whatsappLink('5511988887777'), 'https://wa.me/5511988887777');
  assert.equal(whatsappLink('123'), null);
});

test('clientesParaCsv: BOM, separador ;, aspas escapadas e proteção contra fórmula', () => {
  const rows = [{ nome: '=HYPERLINK("x")', telefone: '11', email: 'a;b@x.com', cnpj: '', compras: 2, gasto: 150.5, ultimaCompra: '2026-10-11', diasSemComprar: 8 }];
  const csv = clientesParaCsv(rows);
  assert.equal(csv.charCodeAt(0), 0xFEFF);
  const [cab, linha] = csv.slice(1).split('\r\n');
  assert.equal(cab.split(';').length, 8);
  assert.ok(linha.startsWith('"\'=HYPERLINK(""x"")";11;"a;b@x.com";;2;150,50;11/10/2026;8'));
});
