import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCor, mapaDeCores } from './cores.js';

test('validateCor: normaliza nome e hex', () => {
  assert.deepEqual(validateCor({ name: '  Verde   Musgo ', hex: '#5c6b3a' }), { name: 'Verde Musgo', hex: '#5C6B3A' });
});

test('validateCor: recusa nome vazio, hex inválido e cor repetida (ignora maiúscula/acento)', () => {
  assert.throws(() => validateCor({ name: ' ', hex: '#000000' }), /obrigatório/);
  assert.throws(() => validateCor({ name: 'X', hex: 'vermelho' }), /Cor inválida/);
  assert.throws(() => validateCor({ name: 'lilás', hex: '#9B7EC8' }, ['Lilas']), /já existe/);
});

test('mapaDeCores: só linhas com hex válido', () => {
  assert.deepEqual(
    mapaDeCores([{ name: 'Preto', hex_code: '#1A1A1A' }, { name: 'Torta', hex_code: 'x' }, { name: null, hex_code: '#FFFFFF' }]),
    { Preto: '#1A1A1A' },
  );
});
