import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizaCategoria, resolveCategoria, listarCategorias } from './categorias.js';

test('normalizaCategoria: tira espaços sobrando', () => {
  assert.equal(normalizaCategoria('  Vestidos   longos '), 'Vestidos longos');
  assert.equal(normalizaCategoria(null), '');
});

test('resolveCategoria: reaproveita a grafia existente (maiúscula/acento) e aceita categoria nova', () => {
  const existentes = ['Vestidos', 'Calcas', 'Macacões'];
  assert.equal(resolveCategoria(' vestidos ', existentes), 'Vestidos');
  assert.equal(resolveCategoria('macacoes', existentes), 'Macacões');
  assert.equal(resolveCategoria('Saias  midi', existentes), 'Saias midi');
  assert.equal(resolveCategoria('saias midi', existentes), 'Saias midi');
});

test('listarCategorias: ordem do negócio primeiro, novas em ordem alfabética, sem repetir', () => {
  const produtos = [{ cat: 'Saias' }, { cat: 'Blusas' }, { cat: 'Vestidos' }, { cat: 'Blusas' }, { cat: 'Acessórios' }, { cat: null }];
  assert.deepEqual(listarCategorias(produtos, ['Vestidos', 'Blusas']), ['Vestidos', 'Blusas', 'Acessórios', 'Saias']);
});

test('listarCategorias: sem produtos, lista vazia (categoria sem produto some da loja)', () => {
  assert.deepEqual(listarCategorias([], ['Vestidos']), []);
});
