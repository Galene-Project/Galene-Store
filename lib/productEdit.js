import { normalizaCategoria } from './categorias.js';

// Campos editáveis de um produto já criado. SKU fica de fora (está nos códigos de
// barras das variantes). Só valida os campos que vieram.
export function validateEdit({ name, category, material, description, price } = {}) {
  const out = {};
  if (name !== undefined) {
    const n = String(name).trim().replace(/\s+/g, ' ');
    if (!n) throw new Error('Nome obrigatório.');
    if (n.length > 120) throw new Error('Nome muito longo (máx. 120).');
    out.name = n;
  }
  if (category !== undefined) {
    const c = normalizaCategoria(category);
    if (!c) throw new Error('Categoria obrigatória.');
    out.category = c;
  }
  if (material !== undefined) out.material = String(material).trim() || null;
  if (description !== undefined) out.description = String(description).trim() || null;
  if (price !== undefined) {
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) throw new Error('Preço inválido.');
    out.price = p;
  }
  return out;
}

// Reajuste do preço BASE. Sem promoção, é o próprio price. Em promoção, price é o
// preço promocional e price_original é o base: muda o base e recalcula o desconto.
export function applyBasePrice(product, novoBase) {
  if (product.price_original == null) return { price: novoBase };
  const promo = Number(product.price);
  if (novoBase <= promo) {
    throw new Error('O novo preço base precisa ser maior que o preço promocional atual. Remova a promoção primeiro.');
  }
  return { price_original: novoBase, discount_percentage: Math.round((1 - promo / novoBase) * 100) };
}
