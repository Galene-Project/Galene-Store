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

  const { telefone } = req.body || {};
  if (!telefone?.trim()) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'telefone obrigatório.', details: [] } });
  }

  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('id, name, company_name, cnpj, phone, email')
    .ilike('phone', `%${telefone.trim()}%`)
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) {
    console.error('Erro ao buscar cliente:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível buscar o cliente.', details: [] } });
  }

  return res.status(200).json({ ok: true, clientes: data || [] });
}
