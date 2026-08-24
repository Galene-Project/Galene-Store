import test from 'node:test';
import assert from 'node:assert/strict';
import { validateColorPhotos, buildCarouselItems } from './colorPhoto.js';

test('validateColorPhotos mantém entradas com URL válida', () => {
  const result = validateColorPhotos([
    { color_id: 'c1', photo_url: 'https://exemplo.com/foto.jpg' },
  ]);
  assert.deepEqual(result, [{ color_id: 'c1', photo_url: 'https://exemplo.com/foto.jpg' }]);
});

test('validateColorPhotos mantém entradas com photo_url vazio como null (limpar foto)', () => {
  const result = validateColorPhotos([
    { color_id: 'c1', photo_url: '' },
    { color_id: 'c2', photo_url: '   ' },
    { color_id: 'c3', photo_url: 'https://exemplo.com/foto.jpg' },
  ]);
  assert.deepEqual(result, [
    { color_id: 'c1', photo_url: null },
    { color_id: 'c2', photo_url: null },
    { color_id: 'c3', photo_url: 'https://exemplo.com/foto.jpg' },
  ]);
});

test('validateColorPhotos rejeita item sem color_id', () => {
  assert.throws(() => validateColorPhotos([{ photo_url: 'https://exemplo.com/foto.jpg' }]));
});

test('validateColorPhotos rejeita URL que não é http(s)', () => {
  assert.throws(() => validateColorPhotos([{ color_id: 'c1', photo_url: 'javascript:alert(1)' }]));
  assert.throws(() => validateColorPhotos([{ color_id: 'c1', photo_url: 'foto.jpg' }]));
});

test('validateColorPhotos com array vazio retorna array vazio', () => {
  assert.deepEqual(validateColorPhotos([]), []);
});

test('validateColorPhotos rejeita entrada não-array', () => {
  assert.throws(() => validateColorPhotos(undefined));
  assert.throws(() => validateColorPhotos(null));
  assert.throws(() => validateColorPhotos({}));
});

test('buildCarouselItems usa foto da cor como capa quando existe', () => {
  const media = [{ type: 'video', url: 'https://x/v.mp4' }];
  const coresFotos = { Preto: 'https://x/preto.jpg' };
  assert.deepEqual(buildCarouselItems(media, coresFotos, 'Preto'), [
    { type: 'image', url: 'https://x/preto.jpg' },
    { type: 'video', url: 'https://x/v.mp4' },
  ]);
});

test('buildCarouselItems retorna media original sem foto de cor', () => {
  const media = [{ type: 'image', url: 'https://x/a.jpg' }];
  assert.equal(buildCarouselItems(media, { Branco: 'https://x/b.jpg' }, 'Preto'), media);
  assert.equal(buildCarouselItems(media, undefined, 'Preto'), media);
  assert.equal(buildCarouselItems(media, {}, 'Preto'), media);
});
