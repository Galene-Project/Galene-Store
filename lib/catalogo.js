import { corBaixa, corEsgotada } from "./estoqueStatus.js";
import { sortSizes } from "./galeneTheme.js";

// ponytail: só M/G/Unico aparecem na loja por decisão do negócio (2026-08-14);
// os outros tamanhos continuam no banco (stock intacto) pra reativar sem migração.
export const TAMANHOS_VISIVEIS = new Set(["M", "G", "Unico"]);

// Monta o mapa cor→tamanho→status por produto, cruzando as linhas de
// stock (via GaleneStore.jsx) com o status público (view
// estoque_status_publico, sem quantidade — ver Task 2 do plano).
export function mapProdutos(products, statusRows, tamanhosVisiveis) {
  const statusMap = new Map(
    statusRows.map((r) => [`${r.product_id}:${r.color_id}:${r.size_id}`, r.status])
  );

  return products.map((p) => {
    const corTam = {};
    // Semeia toda cor do produto, mesmo sem estoque visível ainda —
    // sem isso, uma cor sem linha de stock pra nenhum tamanho visível
    // nunca aparece em corTam, e corEsgotadaMap fica undefined (parece
    // disponível, mas não tem tamanho nenhum pra escolher).
    (p.product_colors || []).forEach((pc) => {
      const nome = pc.colors?.name;
      if (nome) corTam[nome] = corTam[nome] || {};
    });

    (p.stock || []).forEach((s) => {
      const corNome = s.colors?.name;
      const tamNome = s.sizes?.name;
      if (!corNome || !tamNome || !tamanhosVisiveis.has(tamNome)) return;
      const status = statusMap.get(`${p.id}:${s.color_id}:${s.size_id}`) || "ok";
      corTam[corNome] = corTam[corNome] || {};
      corTam[corNome][tamNome] = status;
    });

    const corBaixaMap = {};
    const corEsgotadaMap = {};
    Object.keys(corTam).forEach((c) => {
      const semTamanhoVisivel = Object.keys(corTam[c]).length === 0;
      corBaixaMap[c] = corBaixa(corTam[c]);
      // Cor sem nenhum tamanho visível conta como esgotada pra UI —
      // corEsgotada({}) responde false pela definição pura (Task 1),
      // mas aqui "não tem o que vender" tem que desabilitar a cor.
      corEsgotadaMap[c] = semTamanhoVisivel || corEsgotada(corTam[c]);
    });

    return { ...p, corTam, corBaixaMap, corEsgotadaMap };
  });
}

// Linhas cruas do Supabase (products + product_colors/stock/product_media
// aninhados) + status público → produtos prontos pra vitrine. Compartilhado
// entre a loja e outras telas.
export function buildCatalogo(rows, statusRows) {
  const base = (rows || []).map((p) => ({
    id: p.id,
    nome: p.name,
    cat: p.category,
    sub: p.material,
    preco: Number(p.price),
    precoOriginal: p.price_original ? Number(p.price_original) : null,
    descontoPct: p.discount_percentage ? Number(p.discount_percentage) : null,
    destaque: p.featured,
    tag: p.tag,
    instagramUrls: p.instagram_urls || [],
    isLaunch: p.is_launch,
    media: p.product_media || [],
    desc: p.description,
    cores: [...new Set(p.product_colors.map((pc) => pc.colors.name))],
    coresFotos: Object.fromEntries(
      p.product_colors.filter((pc) => pc.photo_url).map((pc) => [pc.colors.name, pc.photo_url])
    ),
    tamanhos: sortSizes([...new Set(
      p.stock.filter((s) => s.sizes?.name && TAMANHOS_VISIVEIS.has(s.sizes.name)).map((s) => s.sizes.name)
    )]),
    product_colors: p.product_colors,
    stock: p.stock,
  }));

  return mapProdutos(base, statusRows || [], TAMANHOS_VISIVEIS)
    .map(({ product_colors, stock, product_media, ...p }) => p)
    .filter((p) => p.cores.length && p.tamanhos.length);
}

export function filtrarPorCategoria(produtos, cat) {
  if (cat === "destaques") return produtos.filter((p) => p.destaque);
  if (cat === "promocoes") return produtos.filter((p) => p.precoOriginal != null);
  if (cat === "lancamentos") return produtos.filter((p) => p.isLaunch);
  return produtos.filter((p) => p.cat === cat);
}
