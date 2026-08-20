import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInstagramLink, buildFacebookLink, buildWhatsappLink } from './socialLinks.js';

test('instagram: handle vira link, url passa direto, vazio vira null', () => {
  assert.equal(buildInstagramLink('@galene'), 'https://instagram.com/galene');
  assert.equal(buildInstagramLink('galene'), 'https://instagram.com/galene');
  assert.equal(buildInstagramLink('https://instagram.com/galene.oficial'), 'https://instagram.com/galene.oficial');
  assert.equal(buildInstagramLink(''), null);
  assert.equal(buildInstagramLink(null), null);
});

test('facebook: mesmo padrão do instagram', () => {
  assert.equal(buildFacebookLink('galene'), 'https://facebook.com/galene');
  assert.equal(buildFacebookLink('https://facebook.com/galene'), 'https://facebook.com/galene');
  assert.equal(buildFacebookLink(''), null);
});

test('whatsapp: número vira wa.me, url passa direto', () => {
  assert.equal(buildWhatsappLink('5511999998888'), 'https://wa.me/5511999998888');
  assert.equal(buildWhatsappLink('(11) 99999-8888'), 'https://wa.me/11999998888');
  assert.equal(buildWhatsappLink('https://wa.me/5511999998888'), 'https://wa.me/5511999998888');
  assert.equal(buildWhatsappLink(''), null);
});
