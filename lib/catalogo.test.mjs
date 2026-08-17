import test from 'node:test';
import assert from 'node:assert/strict';
import { mapProdutos } from './catalogo.js';

const TAM_VIS = new Set(['M', 'G', 'Unico']);

test('cor com stock nos tamanhos visíveis: corTam/corBaixaMap/corEsgotadaMap populados', () => {
  const products = [{
    id: 'p1',
    product_colors: [{ colors: { name: 'Preto' } }],
    stock: [
      { color_id: 'c1', size_id: 's1', colors: { name: 'Preto' }, sizes: { name: 'M' } },
      { color_id: 'c1', size_id: 's2', colors: { name: 'Preto' }, sizes: { name: 'G' } },
    ],
  }];
  const statusRows = [
    { product_id: 'p1', color_id: 'c1', size_id: 's1', status: 'baixo' },
    { product_id: 'p1', color_id: 'c1', size_id: 's2', status: 'ok' },
  ];
  const [out] = mapProdutos(products, statusRows, TAM_VIS);
  assert.deepEqual(out.corTam, { Preto: { M: 'baixo', G: 'ok' } });
  assert.equal(out.corBaixaMap.Preto, true);
  assert.equal(out.corEsgotadaMap.Preto, false);
});

test('cor em product_colors sem nenhuma linha de stock: corTam[cor] = {}, corEsgotadaMap[cor] = true', () => {
  const products = [{
    id: 'p1',
    product_colors: [{ colors: { name: 'Azul' } }],
    stock: [],
  }];
  const [out] = mapProdutos(products, [], TAM_VIS);
  assert.deepEqual(out.corTam.Azul, {});
  assert.equal(out.corEsgotadaMap.Azul, true);
  assert.equal(out.corBaixaMap.Azul, false);
});

test('tamanho fora de tamanhosVisiveis é excluído de corTam', () => {
  const products = [{
    id: 'p1',
    product_colors: [{ colors: { name: 'Preto' } }],
    stock: [
      { color_id: 'c1', size_id: 's1', colors: { name: 'Preto' }, sizes: { name: 'P' } },
    ],
  }];
  const [out] = mapProdutos(products, [], TAM_VIS);
  assert.deepEqual(out.corTam.Preto, {});
});

test('linha de stock com colors/sizes nulos é ignorada sem lançar', () => {
  const products = [{
    id: 'p1',
    product_colors: [{ colors: { name: 'Preto' } }],
    stock: [
      { color_id: 'c1', size_id: 's1', colors: null, sizes: { name: 'M' } },
      { color_id: 'c1', size_id: 's2', colors: { name: 'Preto' }, sizes: null },
    ],
  }];
  assert.doesNotThrow(() => mapProdutos(products, [], TAM_VIS));
  const [out] = mapProdutos(products, [], TAM_VIS);
  assert.deepEqual(out.corTam.Preto, {});
});

test('dois produtos com mesma cor/tamanho mas ids diferentes não se contaminam', () => {
  const products = [
    {
      id: 'p1',
      product_colors: [{ colors: { name: 'Preto' } }],
      stock: [{ color_id: 'cA', size_id: 'sA', colors: { name: 'Preto' }, sizes: { name: 'M' } }],
    },
    {
      id: 'p2',
      product_colors: [{ colors: { name: 'Preto' } }],
      stock: [{ color_id: 'cB', size_id: 'sB', colors: { name: 'Preto' }, sizes: { name: 'M' } }],
    },
  ];
  const statusRows = [
    { product_id: 'p1', color_id: 'cA', size_id: 'sA', status: 'esgotado' },
    { product_id: 'p2', color_id: 'cB', size_id: 'sB', status: 'ok' },
  ];
  const [out1, out2] = mapProdutos(products, statusRows, TAM_VIS);
  assert.equal(out1.corTam.Preto.M, 'esgotado');
  assert.equal(out2.corTam.Preto.M, 'ok');
});
