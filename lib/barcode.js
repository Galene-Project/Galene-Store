// Código por variante: <SKU base>-<índice da cor>-<índice do tamanho>.
// Índice da cor: ordem de primeira aparição da cor entre as variantes do
// produto (1, 2, 3...). Índice do tamanho: ordem de primeira aparição do
// tamanho DENTRO daquela cor (reinicia a cada cor nova).
export function computeVariantCodes(baseSku, variants) {
  const colorOrder = [];
  const sizeOrderByColor = new Map();

  variants.forEach((v) => {
    if (!colorOrder.includes(v.color_id)) colorOrder.push(v.color_id);
    if (!sizeOrderByColor.has(v.color_id)) sizeOrderByColor.set(v.color_id, []);
    const sizes = sizeOrderByColor.get(v.color_id);
    if (!sizes.includes(v.size_id)) sizes.push(v.size_id);
  });

  return variants.map((v) => {
    const colorIndex = colorOrder.indexOf(v.color_id) + 1;
    const sizeIndex = sizeOrderByColor.get(v.color_id).indexOf(v.size_id) + 1;
    return { ...v, colorIndex, sizeIndex, code: `${baseSku}-${colorIndex}-${sizeIndex}` };
  });
}
