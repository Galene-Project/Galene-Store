# Banco de dados (Supabase)

O esquema do banco vive aqui, no repositório. Cada loja tem o seu próprio projeto Supabase
com **este mesmo esquema**.

## Arquivos

- `migrations/20261026000000_baseline.sql`: esquema completo exportado do Galene em
  2026-10-26 (tabelas, regras de acesso, funções, view de estoque, permissões, bucket de
  fotos, agendamento das despesas fixas). Já inclui as permissões endurecidas.
- `migrations/AAAAMMDDHHMMSS_*.sql`: mudanças futuras, uma por arquivo, em ordem de data.
- `seed.sql`: tamanhos, cores padrão e a linha de configuração da loja.

## Regra de ouro

Toda mudança de banco vira um arquivo novo em `migrations/` **no mesmo commit** do código que
a usa. Mudar direto no painel do Supabase sem registrar aqui quebra a próxima loja criada.

## Criar uma loja nova (manual, até existir o script de provisionamento)

1. Crie um projeto Supabase (região próxima dos clientes da loja).
2. No editor SQL, rode `migrations/20261026000000_baseline.sql` e depois cada migração mais nova.
3. Rode `seed.sql`.
4. Authentication > Users: crie o usuário administrador (e-mail e senha forte).
   Authentication > Sign In / Providers: desligue "Allow new users to sign up" e ligue a
   proteção contra senha vazada.
5. Registre o administrador: `insert into public.admins (user_id) select id from auth.users where email = 'EMAIL_DO_ADMIN';`
6. Crie o projeto na Vercel a partir deste repositório e configure as variáveis:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `ADMIN_PATH` (URL secreta do painel) e, só se a loja usar gateway,
   `MERCADOPAGO_ACCESS_TOKEN`.
7. Entre no painel (`/ADMIN_PATH`), aba Loja: nome, WhatsApp, Instagram, pedido mínimo e chave Pix.

## Conferir se uma loja está igual ao esquema

Rode o aviso de segurança do Supabase (Advisors > Security) e confira que só aparecem os
avisos conhecidos: view `estoque_status_publico` (intencional), `is_admin()` chamável por
quem está logado (intencional) e as tabelas `admins`/`defect_stock` sem policy (só o servidor
acessa).
