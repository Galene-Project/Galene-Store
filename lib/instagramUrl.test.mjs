import test from 'node:test';
import assert from 'node:assert/strict';
import { validateInstagramUrl, validateInstagramUrls } from './instagramUrl.js';

test('aceita link de post', () => {
  assert.equal(validateInstagramUrl('https://www.instagram.com/p/ABC123/'), 'https://www.instagram.com/p/ABC123/');
});

test('aceita link de reel', () => {
  assert.equal(validateInstagramUrl('https://instagram.com/reel/XYZ789/'), 'https://instagram.com/reel/XYZ789/');
});

test('vazio vira null (limpar vídeo)', () => {
  assert.equal(validateInstagramUrl(''), null);
  assert.equal(validateInstagramUrl(null), null);
});

test('rejeita link que não é do instagram', () => {
  assert.throws(() => validateInstagramUrl('https://youtube.com/watch?v=123'));
});

test('rejeita link do instagram que não é post/reel', () => {
  assert.throws(() => validateInstagramUrl('https://www.instagram.com/galene.oficial/'));
});

test('validateInstagramUrls valida cada link e descarta vazios', () => {
  const result = validateInstagramUrls(['https://www.instagram.com/p/AAA/', '', 'https://www.instagram.com/reel/BBB/']);
  assert.deepEqual(result, ['https://www.instagram.com/p/AAA/', 'https://www.instagram.com/reel/BBB/']);
});

test('validateInstagramUrls propaga erro de link inválido', () => {
  assert.throws(() => validateInstagramUrls(['https://youtube.com/x']));
});

test('validateInstagramUrls com entrada não-array devolve lista vazia', () => {
  assert.deepEqual(validateInstagramUrls(undefined), []);
});
