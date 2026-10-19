// Dinheiro no padrão do painel: sinal antes do símbolo (-R$1.234,50), nunca
// "R$-1.234,50". Antes cada aba tinha a sua cópia de formatBRL e só uma
// tratava negativo.
export function formatBRL(v) {
  const n = Number(v);
  const sign = n < 0 ? "-" : "";
  return `${sign}R$${Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

// Versão compacta pra card/eixo de gráfico: R$5.1k, -R$15.9k. Abaixo de mil
// mostra o valor cheio em vez de "R$0.4k".
export function formatBRLk(v) {
  const n = Number(v);
  if (Math.abs(n) < 1000) return formatBRL(n);
  const sign = n < 0 ? "-" : "";
  return `${sign}R$${(Math.abs(n) / 1000).toFixed(1)}k`;
}
