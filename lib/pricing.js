// Recalcula os itens/total do pedido a partir do preço real do banco — nunca
// confia no `item.preco` que vem do corpo do POST (o carrinho é montado no
// client, então esse valor é editável por quem chama a API direto).
// Achado na auditoria de segurança de 2026-08-14: sem isso, dava pra pagar
// qualquer valor no Mercado Pago e o pedido/estoque eram processados normalmente.
export function computeOrderItems(cart, products) {
  const priceById = new Map(products.map((p) => [p.id, Number(p.price)]));
  const items = [];
  for (const item of cart) {
    const unitPrice = priceById.get(item.id);
    if (unitPrice === undefined) {
      throw new Error(`Produto indisponível ou não encontrado: ${item.id}`);
    }
    if (!(unitPrice > 0) || !Number.isFinite(unitPrice)) {
      throw new Error(`Produto com preço inválido no cadastro: ${item.id}`);
    }
    for (const s of item.sel) {
      if (!Number.isInteger(s.qtd) || s.qtd < 1) {
        throw new Error(`Quantidade inválida para ${item.nome} (${s.cor}/${s.tam}): ${s.qtd}`);
      }
      items.push({ productId: item.id, nome: item.nome, cor: s.cor, tam: s.tam, quantity: s.qtd, unitPrice });
    }
  }
  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  return { items, total };
}
