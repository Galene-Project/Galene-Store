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
