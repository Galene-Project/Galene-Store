import { corBaixa, corEsgotada } from "./estoqueStatus.js";

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
