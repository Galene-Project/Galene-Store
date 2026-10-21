import { supabaseAdmin } from './supabaseAdmin.js';

const erro = (res, status, code, message) =>
  res.status(status).json({ error: { code, message, details: [] } });

// Quem chama as rotas do painel precisa estar logado E constar em public.admins.
// Responde 401/403 e devolve null; senão devolve o usuário.
export async function requireAdmin(req, res, db = supabaseAdmin) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) { erro(res, 401, 'UNAUTHORIZED', 'Token ausente.'); return null; }

  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user) { erro(res, 401, 'UNAUTHORIZED', 'Sessão inválida ou expirada.'); return null; }

  const { data: admin } = await db.from('admins').select('user_id').eq('user_id', data.user.id).maybeSingle();
  if (!admin) { erro(res, 403, 'FORBIDDEN', 'Sem permissão de administrador.'); return null; }
  return data.user;
}
