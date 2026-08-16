// Confere se o carrinho cabe no estoque antes do pedido virar cobrança.
//
// Sem isso o checkout aceitava qualquer quantidade e o problema só aparecia
// depois do pagamento aprovado, em `pages/api/webhook-pagamento.js`: o
// decremento era `Math.max(0, quantity - pedido)`, então uma venda de 5 em
// cima de um estoque de 2 zerava a linha e perdia as 3 unidades que faltavam.
// Um cancelamento depois devolvia as 5 cheias e o estoque terminava com 3
// peças que nunca existiram.
//
// A chave da variante é produto+cor+tamanho — a mesma de `stock`, onde
// `color_id` é nullable.
const chave = (productId, colorId, sizeId) => `${productId}:${colorId ?? ''}:${sizeId}`;

export function findShortages(items, stockRows) {
  const disponivel = new Map(
    stockRows.map((s) => [chave(s.product_id, s.color_id, s.size_id), s.quantity]),
  );

  // Agrega antes de comparar: a mesma variante pode vir em duas linhas do
  // carrinho, e conferir uma por uma deixa passar 3+3 num estoque de 5.
  const pedido = new Map();
  for (const i of items) {
    const k = chave(i.productId, i.colorId, i.sizeId);
    const atual = pedido.get(k);
    if (atual) atual.quantity += i.quantity;
    else pedido.set(k, { nome: i.nome, cor: i.cor, tam: i.tam, quantity: i.quantity });
  }

  const faltas = [];
  for (const [k, p] of pedido) {
    const tem = disponivel.get(k) ?? 0;
    if (p.quantity > tem) {
      faltas.push({ nome: p.nome, cor: p.cor, tam: p.tam, pedido: p.quantity, disponivel: tem });
    }
  }
  return faltas;
}

export function formatShortages(faltas) {
  return faltas
    .map((f) => `${f.nome} (${f.cor}/${f.tam}): pedido ${f.pedido}, disponível ${f.disponivel}`)
    .join('; ');
}
