import { sortSizes } from "./galeneTheme.js";

export function corBaixa(statusPorTamanho) {
  return Object.values(statusPorTamanho).includes('baixo');
}

export function corEsgotada(statusPorTamanho) {
  const valores = Object.values(statusPorTamanho);
  return valores.length > 0 && valores.every((v) => v === 'esgotado');
}

// Unidades em estoque por tamanho (soma de todas as cores/produtos).
// Linha sem tamanho ou sem saldo não entra.
export function estoquePorTamanho(stockRows) {
  const porTam = new Map();
  for (const r of stockRows) {
    const nome = r.sizes?.name;
    const qtd = Number(r.quantity) || 0;
    if (!nome || qtd <= 0) continue;
    porTam.set(nome, (porTam.get(nome) || 0) + qtd);
  }
  return sortSizes([...porTam.keys()]).map((name) => ({ name, value: porTam.get(name) }));
}
