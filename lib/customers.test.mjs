import { test, describe } from 'node:test';
import assert from 'node:assert';
import { escapeIlikePattern, normalizePhone } from './customers.js';

describe('escapeIlikePattern', () => {
  test('string sem caracteres especiais passa igual', () => {
    assert.strictEqual(escapeIlikePattern('11987654321'), '11987654321');
  });

  test('string com % é escapada', () => {
    assert.strictEqual(escapeIlikePattern('11%2345'), '11\\%2345');
  });

  test('string com _ é escapada', () => {
    assert.strictEqual(escapeIlikePattern('11_2345'), '11\\_2345');
  });

  test('string com \\ é escapada', () => {
    assert.strictEqual(escapeIlikePattern('11\\2345'), '11\\\\2345');
  });

  test('string com múltiplos caracteres especiais é escapada corretamente', () => {
    assert.strictEqual(escapeIlikePattern('11_%\\34'), '11\\_\\%\\\\34');
  });

  test('ordem de escape é preservada (\\ primeiro)', () => {
    // Se \\ primeiro, depois %, _ — evita double-escape
    assert.strictEqual(escapeIlikePattern('\\%_'), '\\\\\\%\\_');
  });

  test('string com * é escapada (PostgREST trata * como sinônimo de %)', () => {
    assert.strictEqual(escapeIlikePattern('11*2345'), '11\\*2345');
  });
});

describe('normalizePhone', () => {
  test('remove tudo que não é dígito', () => {
    assert.strictEqual(normalizePhone('(11) 99999-8888'), '11999998888');
  });

  test('string já só com dígitos passa igual', () => {
    assert.strictEqual(normalizePhone('11999998888'), '11999998888');
  });

  test('string vazia vira string vazia', () => {
    assert.strictEqual(normalizePhone(''), '');
  });

  test('null vira string vazia', () => {
    assert.strictEqual(normalizePhone(null), '');
  });

  test('undefined vira string vazia', () => {
    assert.strictEqual(normalizePhone(undefined), '');
  });
});

import { findCustomerIdByPhone } from './customers.js';

const fakeClient = (result) => {
  const calls = {};
  const q = {
    select: () => q,
    eq: (col, val) => { calls.eq = [col, val]; return q; },
    order: () => q,
    limit: async () => result,
  };
  return { client: { from: () => q }, calls };
};

test('findCustomerIdByPhone: normaliza o telefone e busca por igualdade', async () => {
  const { client, calls } = fakeClient({ data: [{ id: 'c1' }], error: null });
  const id = await findCustomerIdByPhone(client, '(11) 98888-7777');
  assert.equal(id, 'c1');
  assert.deepEqual(calls.eq, ['phone', '11988887777']);
});

test('findCustomerIdByPhone: sem cadastro devolve null', async () => {
  const { client } = fakeClient({ data: [], error: null });
  assert.equal(await findCustomerIdByPhone(client, '11988887777'), null);
});

test('findCustomerIdByPhone: telefone vazio devolve null sem consultar', async () => {
  const { client } = fakeClient({ data: [{ id: 'x' }], error: null });
  assert.equal(await findCustomerIdByPhone(client, 'abc'), null);
});

test('findCustomerIdByPhone: erro do banco propaga', async () => {
  const { client } = fakeClient({ data: null, error: new Error('boom') });
  await assert.rejects(() => findCustomerIdByPhone(client, '11988887777'), /boom/);
});
