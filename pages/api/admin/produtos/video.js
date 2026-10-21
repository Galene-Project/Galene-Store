import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../../lib/requireAdmin';
import { validateInstagramUrls } from '../../../../lib/instagramUrl';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST', details: [] } });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

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
