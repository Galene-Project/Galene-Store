import test from 'node:test';
import assert from 'node:assert/strict';
import { computeOrderItems } from './pricing.js';

test('usa o preço do banco, ignora o preço mandado no carrinho', () => {
  const cart = [{ id: 'p1', nome: 'Vestido Bella', preco: 0.01, sel: [{ cor: 'Preto', tam: 'M', qtd: 6 }] }];
  const products = [{ id: 'p1', price: 40 }];
  const { items, total } = computeOrderItems(cart, products);
  assert.equal(items[0].unitPrice, 40);
  assert.equal(total, 240);
});

test('soma vários itens/variantes corretamente', () => {
  const cart = [
    { id: 'p1', nome: 'A', preco: 999, sel: [{ cor: 'Preto', tam: 'M', qtd: 3 }, { cor: 'Preto', tam: 'G', qtd: 3 }] },
    { id: 'p2', nome: 'B', preco: 999, sel: [{ cor: 'Bege', tam: 'M', qtd: 6 }] },
  ];
  const products = [{ id: 'p1', price: 40 }, { id: 'p2', price: 50 }];
  const { total } = computeOrderItems(cart, products);
  assert.equal(total, 6 * 40 + 6 * 50);
});

test('rejeita produto que não veio do banco (inexistente/inativo)', () => {
  const cart = [{ id: 'p-fantasma', nome: 'X', preco: 1, sel: [{ cor: 'Preto', tam: 'M', qtd: 6 }] }];
  assert.throws(() => computeOrderItems(cart, []), /indisponível ou não encontrado/);
});

test('rejeita quantidade negativa, zero ou fracionária', () => {
  const products = [{ id: 'p1', price: 40 }];
  for (const qtd of [-100, 0, 2.5]) {
    const cart = [{ id: 'p1', nome: 'A', sel: [{ cor: 'Preto', tam: 'M', qtd }] }];
    assert.throws(() => computeOrderItems(cart, products), /Quantidade inválida/);
  }
});
