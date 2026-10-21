import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../../lib/requireAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST', details: [] } });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { productId, isLaunch } = req.body || {};
  if (!productId || typeof isLaunch !== 'boolean') {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'productId ou isLaunch inválido.', details: [] } });
  }

  try {
    const { error: updateErr } = await supabaseAdmin.from('products').update({ is_launch: isLaunch }).eq('id', productId);
    if (updateErr) throw updateErr;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro ao atualizar lançamento do produto:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível atualizar o lançamento.', details: [] } });
  }
}
