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
export async function findCustomerIdByPhone(client, phone) {
  const normalizado = normalizePhone(phone);
  if (!normalizado) return null;
  const { data, error } = await client
    .from('customers')
    .select('id')
    .eq('phone', normalizado)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0]?.id ?? null;
}
