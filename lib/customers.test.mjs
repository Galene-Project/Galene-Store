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
