import test from 'node:test';
import assert from 'node:assert/strict';
import { crc16, buildPixPayload, normalizaChavePix } from './pixPayload.js';

// Campos TLV de nível 1 do payload, na ordem.
const parse = (s) => {
  const out = []; let i = 0;
  while (i < s.length) { const id = s.slice(i, i + 2); const n = Number(s.slice(i + 2, i + 4)); out.push([id, s.slice(i + 4, i + 4 + n)]); i += 4 + n; }
  return out;
};

test('crc16: vetor padrão CCITT-FALSE', () => {
  assert.equal(crc16('123456789'), '29B1');
});

test('buildPixPayload: campos, valor com 2 casas, nome sem acento e CRC válido', () => {
  const p = buildPixPayload({ key: '12.345.678/0001-95', name: 'Galêne Moda Ltda', city: 'São Paulo', amount: 553, txid: 'PED-0016' });
  const campos = Object.fromEntries(parse(p));
  assert.equal(campos['54'], '553.00');
  assert.equal(campos['59'], 'GALENE MODA LTDA');
  assert.equal(campos['60'], 'SAO PAULO');
  assert.deepEqual(parse(campos['26']), [['00', 'BR.GOV.BCB.PIX'], ['01', '12345678000195']]);
  assert.deepEqual(parse(campos['62']), [['05', 'PED0016']]);
  assert.equal(p.slice(-4), crc16(p.slice(0, -4)));
});

test('buildPixPayload: valor inválido ou chave vazia lança erro', () => {
  assert.throws(() => buildPixPayload({ key: '', name: 'X', city: 'Y', amount: 10 }));
  assert.throws(() => buildPixPayload({ key: 'a@b.com', name: 'X', city: 'Y', amount: 0 }));
});

test('normalizaChavePix: CPF/CNPJ só dígitos; e-mail e telefone intactos', () => {
  assert.equal(normalizaChavePix('123.456.789-09'), '12345678909');
  assert.equal(normalizaChavePix('+5511999999999'), '+5511999999999');
  assert.equal(normalizaChavePix(' a@b.com '), 'a@b.com');
});
