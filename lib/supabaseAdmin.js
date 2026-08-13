import { createClient } from '@supabase/supabase-js';

// Client com service_role — só pode ser importado em pages/api/* (server).
// Nunca importar isso em componentes/páginas que rodam no navegador:
// essa chave ignora RLS por completo.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
