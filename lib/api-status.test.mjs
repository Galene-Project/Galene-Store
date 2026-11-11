import test from 'node:test';
import assert from 'node:assert/strict';
import { fakeDb, resFalso } from './fakeDb.mjs';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'x';
const { default: handler } = await import('../pages/api/admin/pedidos/status.js');

const ok = async () => ({ data: 'ok', error: null });
const banco = (status, rpc = {}) => fakeDb(
  { admins: [{ user_id: 'admin-ok' }], orders: [{ id: 'o1', status }] },
  { rpc: { claim_payment_and_decrement_stock: ok, update_order_status_and_restore_stock: ok, ...rpc } },
);
const chamar = async (db, body, token = 'admin-ok') => {
  const r = resFalso();
  await handler({ method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {}, body }, r, db);
  return r;
};

test('sem login → 401; logado que não é admin → 403', async () => {
  assert.equal((await chamar(banco('aguardando_pagamento'), { orderId: 'o1', novoStatus: 'confirmado' }, null)).s, 401);
  assert.equal((await chamar(banco('aguardando_pagamento'), { orderId: 'o1', novoStatus: 'confirmado' }, 'user-comum')).s, 403);
});

test('status inválido → 400', async () => {
  const r = await chamar(banco('aguardando_pagamento'), { orderId: 'o1', novoStatus: 'entregue' });
  assert.equal(r.s, 400);
});

test('pedido inexistente → 404', async () => {
  const r = await chamar(banco('aguardando_pagamento'), { orderId: 'nao-existe', novoStatus: 'confirmado' });
  assert.equal(r.s, 404);
});

test('confirmar pedido aguardando pagamento baixa o estoque uma vez e segue para confirmado', async () => {
  const db = banco('aguardando_pagamento');
  const r = await chamar(db, { orderId: 'o1', novoStatus: 'confirmado' });
  assert.equal(r.s, 200);
  assert.equal(db.chamadas.filter((c) => c === 'rpc.claim_payment_and_decrement_stock').length, 1);
  assert.equal(db.chamadas.filter((c) => c === 'rpc.update_order_status_and_restore_stock').length, 1);
});

test('confirmar como "pago" só baixa o estoque, sem segundo update', async () => {
  const db = banco('aguardando_pagamento');
  const r = await chamar(db, { orderId: 'o1', novoStatus: 'pago' });
  assert.equal(r.s, 200);
  assert.deepEqual(db.chamadas.filter((c) => c.startsWith('rpc.')), ['rpc.claim_payment_and_decrement_stock']);
});

test('cancelar pedido já confirmado devolve o estoque (sem baixar de novo)', async () => {
  let args;
  const db = banco('confirmado', { update_order_status_and_restore_stock: async (a) => { args = a; return ok(); } });
  const r = await chamar(db, { orderId: 'o1', novoStatus: 'cancelado' });
  assert.equal(r.s, 200);
  assert.equal(args.p_must_restore, true);
  assert.equal(db.chamadas.includes('rpc.claim_payment_and_decrement_stock'), false);
});

test('cancelar pedido que nunca baixou estoque não devolve nada', async () => {
  let args;
  const db = banco('aguardando_pagamento', { update_order_status_and_restore_stock: async (a) => { args = a; return ok(); } });
  await chamar(db, { orderId: 'o1', novoStatus: 'cancelado' });
  assert.equal(args.p_must_restore, false);
});

test('pedido já pago por outra requisição → 409', async () => {
  const db = banco('aguardando_pagamento', { claim_payment_and_decrement_stock: async () => ({ data: 'already_paid', error: null }) });
  const r = await chamar(db, { orderId: 'o1', novoStatus: 'confirmado' });
  assert.equal(r.s, 409);
  assert.equal(db.chamadas.includes('rpc.update_order_status_and_restore_stock'), false);
});

test('estoque insuficiente na confirmação → 409 INSUFFICIENT_STOCK', async () => {
  const db = banco('aguardando_pagamento', { claim_payment_and_decrement_stock: async () => ({ data: null, error: Object.assign(new Error('check'), { code: '23514' }) }) });
  const r = await chamar(db, { orderId: 'o1', novoStatus: 'confirmado' });
  assert.equal(r.s, 409);
  assert.equal(r.b.error.code, 'INSUFFICIENT_STOCK');
});
