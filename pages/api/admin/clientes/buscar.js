import { supabaseAdmin } from '../../../../lib/supabaseAdmin';
import { escapeIlikePattern, parseBusca } from '../../../../lib/customers';

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

  // `busca` aceita telefone ou e-mail; `telefone` segue valendo (compatibilidade).
  const { busca, telefone } = req.body || {};
  const alvo = parseBusca(busca ?? telefone);
  if (!alvo) {
    return res.status(400).json({ error: { code: 'VALIDATION_FAILED', message: 'telefone ou e-mail obrigatório.', details: [] } });
  }

  const query = supabaseAdmin
    .from('customers')
    .select('id, name, company_name, cnpj, phone, email')
    // e-mail: igualdade sem diferenciar maiúscula (ilike sem curinga); telefone: trecho
    .ilike(alvo.tipo === 'email' ? 'email' : 'phone', alvo.tipo === 'email' ? escapeIlikePattern(alvo.valor) : `%${escapeIlikePattern(alvo.valor)}%`)
    .order('created_at', { ascending: false })
    .limit(1);
  const { data, error } = await query;
  if (error) {
    console.error('Erro ao buscar cliente:', error);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Não foi possível buscar o cliente.', details: [] } });
  }

  return res.status(200).json({ ok: true, clientes: data || [] });
}
