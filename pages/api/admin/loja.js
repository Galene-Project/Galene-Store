import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../lib/requireAdmin';
import { validateMinOrder } from '../../../lib/storeSettings';
import { buildPixPayload } from '../../../lib/pixPayload';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST', details: [] } });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { name, agent_name, whatsapp, instagram, facebook, min_order, pix_key, pix_name, pix_city } = req.body || {};
  if (!name?.trim() || !agent_name?.trim()) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'Nome da loja e nome do agente são obrigatórios.', details: [] } });
  }

  let minOrder;
  try {
    minOrder = validateMinOrder(min_order);
  } catch (e) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: e.message, details: [] } });
  }

  // Chave Pix preenchida exige nome e cidade, e precisa gerar um código válido.
  if (pix_key?.trim()) {
    try {
      buildPixPayload({ key: pix_key, name: pix_name, city: pix_city, amount: 1, txid: 'TESTE' });
    } catch (e) {
      return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'Chave Pix inválida.', details: [] } });
    }
    if (!pix_name?.trim() || !pix_city?.trim()) {
      return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'Informe o nome do recebedor e a cidade do Pix.', details: [] } });
    }
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
        facebook: facebook?.trim() || null,
        min_order: minOrder,
        pix_key: pix_key?.trim() || null,
        pix_name: pix_name?.trim() || null,
        pix_city: pix_city?.trim() || null,
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
