import test from 'node:test';
import assert from 'node:assert/strict';
import { fakeDb, resFalso } from './fakeDb.mjs';

// supabaseAdmin é criado no import da rota; a rota recebe o banco por parâmetro.
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'x';
delete process.env.MERCADOPAGO_ACCESS_TOKEN;
const { default: handler } = await import('../pages/api/pedidos.js');

const form = { razao: 'Loja X', end: 'Rua 1', tel: '(11) 99999-0000', email: 'a@b.com' };
const cart = (qtd = 6, preco = 0.01) => [{ id: 'p1', nome: 'Vestido', preco, sel: [{ cor: 'Preto', tam: 'M', qtd }] }];
const banco = (extra = {}, estoque = 10) => fakeDb({
  products: [{ id: 'p1', price: 40, is_active: true }],
  store_settings: [{ min_order: 6, pix_key: 'chave@pix.com', pix_name: 'Galene', pix_city: 'SAO PAULO' }],
  colors: [{ id: 'c1', name: 'Preto' }],
  sizes: [{ id: 's1', name: 'M' }],
  stock: [{ product_id: 'p1', color_id: 'c1', size_id: 's1', quantity: estoque }],
}, { rpc: { next_order_number: async () => ({ data: 'PED-0001', error: null }) }, ...extra });
const chamar = async (db, req) => { const r = resFalso(); await handler(req, r, db); return r; };

test('método diferente de POST → 405', async () => {
  const r = await chamar(banco(), { method: 'GET' });
  assert.equal(r.s, 405);
});

test('dados obrigatórios faltando → 400, nada gravado', async () => {
  const db = banco();
  const r = await chamar(db, { method: 'POST', body: { form: { ...form, email: 'sem-arroba' }, cart: cart() } });
  assert.equal(r.s, 400);
  assert.equal(db.tabelas.orders.length, 0);
});

test('abaixo do pedido mínimo → 400', async () => {
  const r = await chamar(banco(), { method: 'POST', body: { form, cart: cart(5) } });
  assert.equal(r.s, 400);
  assert.match(r.b.error.message, /mínimo de 6/);
});

test('estoque insuficiente → 409 e nada gravado', async () => {
  const db = banco({}, 3);
  const r = await chamar(db, { method: 'POST', body: { form, cart: cart(6) } });
  assert.equal(r.s, 409);
  assert.equal(r.b.error.code, 'INSUFFICIENT_STOCK');
  assert.equal(db.tabelas.orders.length, 0);
  assert.equal(db.tabelas.customers.length, 0);
});

test('caminho feliz: total vem do banco, não do preço mandado pelo cliente', async () => {
  const db = banco();
  const r = await chamar(db, { method: 'POST', body: { form, cart: cart(6, 0.01) } });
  assert.equal(r.s, 200);
  assert.equal(r.b.order_number, 'PED-0001');
  assert.equal(r.b.total, 240);
  assert.ok(r.b.pix, 'gera o Pix quando a loja tem chave');
  assert.equal(db.tabelas.orders[0].total, 240);
  assert.equal(db.tabelas.order_items[0].unit_price, 40);
  assert.equal(db.tabelas.customers[0].phone, '11999990000');
});

test('falha ao gravar os itens desfaz pedido e cliente novo', async () => {
  const db = banco({ falhar: ['order_items.insert'] });
  const r = await chamar(db, { method: 'POST', body: { form, cart: cart() } });
  assert.equal(r.s, 500);
  assert.equal(db.tabelas.orders.length, 0);
  assert.equal(db.tabelas.customers.length, 0);
});
