import test from 'node:test';
import assert from 'node:assert/strict';

// supabaseAdmin é criado no import; o helper recebe o client por parâmetro nos testes.
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'x';
const { requireAdmin } = await import('./requireAdmin.js');

const res = () => { const r = { status(s) { r.s = s; return r; }, json(b) { r.b = b; return r; } }; return r; };
const db = (user, admins) => ({
  auth: { getUser: async () => (user ? { data: { user } } : { error: {} }) },
  from: () => ({ select: () => ({ eq: (_c, id) => ({ maybeSingle: async () => ({ data: admins.includes(id) ? { user_id: id } : null }) }) }) }),
});

test('sem token → 401', async () => {
  const r = res();
  assert.equal(await requireAdmin({ headers: {} }, r, db(null, [])), null);
  assert.equal(r.s, 401);
});

test('token inválido → 401', async () => {
  const r = res();
  assert.equal(await requireAdmin({ headers: { authorization: 'Bearer x' } }, r, db(null, [])), null);
  assert.equal(r.s, 401);
});

test('logado mas fora da lista de admins → 403', async () => {
  const r = res();
  assert.equal(await requireAdmin({ headers: { authorization: 'Bearer x' } }, r, db({ id: 'u2' }, ['u1'])), null);
  assert.equal(r.s, 403);
});

test('admin → devolve o usuário, sem responder', async () => {
  const r = res();
  const u = await requireAdmin({ headers: { authorization: 'Bearer x' } }, r, db({ id: 'u1' }, ['u1']));
  assert.equal(u.id, 'u1');
  assert.equal(r.s, undefined);
});
