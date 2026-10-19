import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeIntoCart } from './cart.js';

test('produto novo entra no fim do carrinho', () => {
  const out = mergeIntoCart([{ id: 'a', sel: [] }], { id: 'b', nome: 'B' }, [{ key: 'k1', qtd: 2 }]);
  assert.equal(out.length, 2);
  assert.deepEqual(out[1].sel, [{ key: 'k1', qtd: 2 }]);
});

test('produto existente soma quantidade na mesma variante e acrescenta variante nova', () => {
  const prev = [{ id: 'a', sel: [{ key: 'k1', qtd: 2 }] }];
  const out = mergeIntoCart(prev, { id: 'a' }, [{ key: 'k1', qtd: 3 }, { key: 'k2', qtd: 1 }]);
  assert.deepEqual(out[0].sel, [{ key: 'k1', qtd: 5 }, { key: 'k2', qtd: 1 }]);
});

test('não muta o carrinho anterior', () => {
  const prev = [{ id: 'a', sel: [{ key: 'k1', qtd: 2 }] }];
  mergeIntoCart(prev, { id: 'a' }, [{ key: 'k1', qtd: 3 }]);
  assert.equal(prev[0].sel[0].qtd, 2);
});
