import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { validateNewProduct } from '../../../../lib/productCreate';
import { computeVariantCodes } from '../../../../lib/barcode';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST', details: [] } });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token ausente.', details: [] } });
  }

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Sessão inválida ou expirada.', details: [] } });
  }

  let parsed;
  try {
    parsed = validateNewProduct(req.body || {});
  } catch (e) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: e.message, details: [] } });
  }

  const { material, sku, description, photo_url, colorPhotos } = req.body || {};
  const { name, category, price, variants } = parsed;
  const finalSku = sku || `AUTO-${Date.now().toString(36).toUpperCase()}`;

  const { data: product, error: prodErr } = await supabaseAdmin
    .from('products')
    .insert({ name, category, price, material: material || null, sku: finalSku, description: description || null, photo_url: photo_url || null })
    .select('id')
    .single();

  if (prodErr) {
    if (prodErr.code === '23505') {
      return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'SKU já cadastrado.', details: [] } });
    }
    console.error('Erro ao criar produto:', prodErr);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível criar o produto.', details: [] } });
  }

  const productId = product.id;
  const colorIds = [...new Set(variants.map((v) => v.color_id))];

  const { error: colorErr } = await supabaseAdmin
    .from('product_colors')
    .insert(colorIds.map((color_id) => ({ product_id: productId, color_id, photo_url: (colorPhotos && colorPhotos[color_id]) || null })));

  const codedVariants = computeVariantCodes(finalSku, variants);

  const { error: stockErr } = colorErr ? { error: colorErr } : await supabaseAdmin
    .from('stock')
    .insert(codedVariants.map((v) => ({ product_id: productId, color_id: v.color_id, size_id: v.size_id, quantity: Number(v.quantity), barcode: v.code })));

  if (colorErr || stockErr) {
    console.error('Erro ao criar variantes, revertendo produto:', colorErr || stockErr);
    await supabaseAdmin.from('product_colors').delete().eq('product_id', productId);
    await supabaseAdmin.from('stock').delete().eq('product_id', productId);
    await supabaseAdmin.from('products').delete().eq('id', productId);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível criar as variantes do produto.', details: [] } });
  }

  return res.status(200).json({ ok: true, productId, sku: finalSku, variants: codedVariants.map((v) => ({ color_id: v.color_id, size_id: v.size_id, code: v.code })) });
}
