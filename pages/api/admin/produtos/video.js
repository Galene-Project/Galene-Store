import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { validateInstagramUrls } from '../../../../lib/instagramUrl';

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

  const { productId, instagramUrls } = req.body || {};
  if (!productId) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'productId obrigatório.', details: [] } });
  }

  let finalUrls;
  try {
    finalUrls = validateInstagramUrls(instagramUrls);
  } catch (e) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: e.message, details: [] } });
  }

  const { error: updateErr } = await supabaseAdmin.from('products').update({ instagram_urls: finalUrls }).eq('id', productId);
  if (updateErr) {
    console.error('Erro ao atualizar mídia do produto:', updateErr);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível salvar a mídia.', details: [] } });
  }

  return res.status(200).json({ ok: true, instagram_urls: finalUrls });
}
