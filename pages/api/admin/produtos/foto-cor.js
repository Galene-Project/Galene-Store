import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../../lib/requireAdmin';
import { validateColorPhotos } from '../../../../lib/colorPhoto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST', details: [] } });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { productId, colorPhotos } = req.body || {};
  if (!productId) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'productId obrigatório.', details: [] } });
  }

  let finalPhotos;
  try {
    finalPhotos = validateColorPhotos(colorPhotos);
  } catch (e) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: e.message, details: [] } });
  }

  // O payload já cobre toda cor do produto (Catalogo.jsx manda uma entrada
  // por cor, com photo_url vazio quando não tem foto) — cada update abaixo
  // já reflete a intenção completa, sem precisar zerar tudo antes.
  for (const { color_id, photo_url } of finalPhotos) {
    const { error: updateErr } = await supabaseAdmin
      .from('product_colors')
      .update({ photo_url })
      .eq('product_id', productId)
      .eq('color_id', color_id);
    if (updateErr) {
      console.error('Erro ao salvar foto de cor:', updateErr);
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível salvar as fotos.', details: [] } });
    }
  }

  return res.status(200).json({ ok: true, colorPhotos: finalPhotos });
}
