/**
 * Escapa caracteres especiais de ILIKE do Postgres (\, %, _)
 * para evitar wildcard matching não-intencional.
 * Ordem importa: \ primeiro, depois % e _.
 */
export function escapeIlikePattern(str) {
  return str
    .replace(/\\/g, '\\\\')  // \ → \\
    .replace(/%/g, '\\%')    // % → \%
    .replace(/_/g, '\\_')    // _ → \_
    .replace(/\*/g, '\\*');  // * → \* (PostgREST trata * como sinônimo de % na URL)
}

export function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '');
}

// Cliente é identificado pelo telefone (só dígitos). Igualdade exata — a
// busca por ILIKE do painel (clientes/buscar) é pra digitar parcial; aqui
// um telefone só pode bater com o mesmo telefone, senão o pedido de um
// cliente cairia no cadastro de outro. Mais recente primeiro (telefone
// repetido por cadastro antigo duplicado).
export async function findCustomerByPhone(client, phone) {
  const normalizado = normalizePhone(phone);
  if (!normalizado) return null;
  const { data, error } = await client
    .from('customers')
    .select('id, name, company_name, cnpj, email')
    .eq('phone', normalizado)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function findCustomerIdByPhone(client, phone) {
  return (await findCustomerByPhone(client, phone))?.id ?? null;
}

// Cliente recorrente volta com dado novo (e-mail que antes não tinha, CNPJ
// que agora informou). Rota pública só PREENCHE o que está vazio no
// cadastro — nunca troca valor existente (quem souber o telefone de
// outro cliente não consegue reescrever nome/e-mail dele).
export function camposEmBranco(existente, entrada) {
  const preencher = {};
  for (const campo of ['name', 'company_name', 'email', 'cnpj']) {
    const atual = (existente?.[campo] ?? '').toString().trim();
    const novo = (entrada?.[campo] ?? '').toString().trim();
    if (!atual && novo) preencher[campo] = novo;
  }
  return preencher;
}

// Campo de busca do balcão aceita telefone ou e-mail.
export function parseBusca(texto) {
  const t = (texto || '').trim();
  if (!t) return null;
  if (t.includes('@')) return { tipo: 'email', valor: t.toLowerCase() };
  const tel = normalizePhone(t);
  return tel ? { tipo: 'telefone', valor: tel } : null;
}
