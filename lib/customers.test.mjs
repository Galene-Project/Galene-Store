import { test, describe } from 'node:test';
import assert from 'node:assert';
import { escapeIlikePattern } from './customers.js';

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
});
