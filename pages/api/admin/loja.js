import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { validateMinOrder } from '../../../lib/storeSettings';

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

  const { name, agent_name, whatsapp, instagram, min_order } = req.body || {};
  if (!name?.trim() || !agent_name?.trim()) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'Nome da loja e nome do agente são obrigatórios.', details: [] } });
  }

  let minOrder;
  try {
    minOrder = validateMinOrder(min_order);
  } catch (e) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: e.message, details: [] } });
  }

  try {
    const { data: row, error: selErr } = await supabaseAdmin.from('store_settings').select('id').limit(1).single();
    if (selErr || !row) {
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'store_settings sem linha — contate o suporte técnico.', details: [] } });
    }

    const { error: updateErr } = await supabaseAdmin
      .from('store_settings')
      .update({
        name: name.trim(),
        agent_name: agent_name.trim(),
        whatsapp: whatsapp?.trim() || null,
        instagram: instagram?.trim() || null,
        min_order: minOrder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', row.id);
    if (updateErr) throw updateErr;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Erro ao atualizar dados da loja:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível salvar os dados da loja.', details: [] } });
  }
}
