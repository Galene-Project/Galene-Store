import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { computePromotion } from '../../../../lib/catalogPromotion';

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

  const { productId, action, novoPreco } = req.body || {};
  if (!productId || !['aplicar', 'remover'].includes(action)) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'productId ou action inválido.', details: [] } });
  }

  try {
    const { data: product, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('id, price, price_original')
      .eq('id', productId)
      .single();
    if (prodErr || !product) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Produto não encontrado.', details: [] } });
    }

    let update;
    if (action === 'remover') {
      // Idempotente: se não tinha promoção ativa, não há o que reverter.
      if (product.price_original == null) {
        return res.status(200).json({ ok: true });
      }
      update = { price: product.price_original, price_original: null, discount_percentage: null };
    } else {
      let result;
      try {
        result = computePromotion(
          Number(product.price),
          product.price_original == null ? null : Number(product.price_original),
          novoPreco,
        );
      } catch (e) {
        return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: e.message, details: [] } });
      }
      update = result;
    }

    const { error: updateErr } = await supabaseAdmin.from('products').update(update).eq('id', productId);
    if (updateErr) throw updateErr;

    return res.status(200).json({ ok: true, product: update });
  } catch (err) {
    console.error('Erro ao atualizar promoção do produto:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível atualizar a promoção.', details: [] } });
  }
}
