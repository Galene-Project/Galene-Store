import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../lib/requireAdmin';
import { validateCor } from '../../../lib/cores';

// Cria cor nova (nome + #RRGGBB) para usar em produto novo.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Use POST', details: [] } });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const { data: existentes, error: listErr } = await supabaseAdmin.from('colors').select('name');
    if (listErr) throw listErr;

    let cor;
    try {
      cor = validateCor(req.body || {}, (existentes || []).map((c) => c.name));
    } catch (e) {
      return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: e.message, details: [] } });
    }

    const { data, error } = await supabaseAdmin
      .from('colors')
      .insert({ name: cor.name, hex_code: cor.hex })
      .select('id, name, hex_code')
      .single();
    if (error) throw error;

    return res.status(200).json({ ok: true, cor: data });
  } catch (err) {
    console.error('Erro ao criar cor:', err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível criar a cor.', details: [] } });
  }
}
