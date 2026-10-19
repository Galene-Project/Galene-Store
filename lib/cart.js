// Junta uma seleção nova ao carrinho: produto já existente soma quantidade
// por variante (key), produto novo entra no fim. Não muta `prev`.
export function mergeIntoCart(prev, prod, sel) {
  const idx = prev.findIndex((i) => i.id === prod.id);
  if (idx < 0) return [...prev, { ...prod, sel }];

  const merged = [...prev[idx].sel];
  sel.forEach((s) => {
    const mi = merged.findIndex((m) => m.key === s.key);
    if (mi >= 0) merged[mi] = { ...merged[mi], qtd: merged[mi].qtd + s.qtd };
    else merged.push(s);
  });
  const up = [...prev];
  up[idx] = { ...prev[idx], sel: merged };
  return up;
}
