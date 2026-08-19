import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

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
