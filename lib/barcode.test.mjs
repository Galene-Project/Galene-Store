import test from 'node:test';
import assert from 'node:assert/strict';
import { computeVariantCodes } from './barcode.js';

test('gera índice de cor e tamanho na ordem de primeira aparição', () => {
  const variants = [
    { color_id: 'preto', size_id: 'm' },
    { color_id: 'preto', size_id: 'g' },
    { color_id: 'azul', size_id: 'g' },
  ];
  const result = computeVariantCodes('GAL001', variants);
  assert.equal(result[0].code, 'GAL001-1-1'); // preto, m
  assert.equal(result[1].code, 'GAL001-1-2'); // preto, g
  assert.equal(result[2].code, 'GAL001-2-1'); // azul, g (primeiro tamanho dessa cor)
});

test('mesma cor/tamanho repetida gera o mesmo código', () => {
  const variants = [
    { color_id: 'preto', size_id: 'm' },
    { color_id: 'preto', size_id: 'm' },
  ];
  const result = computeVariantCodes('GAL001', variants);
  assert.equal(result[0].code, result[1].code);
});

test('lista vazia não quebra', () => {
  assert.deepEqual(computeVariantCodes('GAL001', []), []);
});
