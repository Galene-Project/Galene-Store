// Categoria vem do banco (products.category), não de uma lista fixa no código.

const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const chave = (s) => semAcento(s).toLowerCase();

// Tira espaços sobrando: "  Vestidos   longos " → "Vestidos longos".
export function normalizaCategoria(s) {
  return String(s || '').trim().replace(/\s+/g, ' ');
}

// Reaproveita a grafia de uma categoria que já existe (ignora maiúscula e acento),
// para "vestidos" e "Vestidos " não virarem duas categorias na loja.
export function resolveCategoria(entrada, existentes) {
  const nova = normalizaCategoria(entrada);
  const igual = existentes.find((e) => chave(normalizaCategoria(e)) === chave(nova));
  // categoria nova: primeira letra maiúscula ("saias midi" → "Saias midi")
  return igual ? normalizaCategoria(igual) : nova.charAt(0).toUpperCase() + nova.slice(1);
}

// Categorias dos produtos da vitrine: as de ORDEM primeiro (mantém a ordem
// escolhida pelo negócio), as novas depois em ordem alfabética.
export function listarCategorias(produtos, ordem = []) {
  const presentes = [...new Set(produtos.map((p) => p.cat).filter(Boolean))];
  const idx = (c) => { const i = ordem.indexOf(c); return i === -1 ? Infinity : i; };
  return presentes.sort((a, b) => (idx(a) - idx(b)) || a.localeCompare(b, 'pt-BR'));
}
