-- Baseline do esquema do Galene (exportado do banco de produção em 2026-10-26).
-- Aplicando este arquivo num projeto Supabase vazio e depois `supabase/seed.sql`,
-- sai um banco igual ao do Galene, pronto para uma loja nova (sem dados de loja).
-- Migrações futuras entram nesta pasta com prefixo de data (AAAAMMDDHHMMSS_nome.sql).
--
-- Fora do SQL (ver supabase/README.md): usuário administrador no Auth, linha em
-- public.admins e dados da loja em public.store_settings.

create extension if not exists pg_cron with schema pg_catalog;

-- Objetos futuros nascem FECHADOS: anon não lê tabela nova, authenticated só lê (RLS decide),
-- ninguém executa função nova e ninguém usa sequência nova. Cada migração concede, de forma
-- explícita, o que a loja pública ou o painel precisam. Escrita e regras de negócio passam
-- pela API (service_role).
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public
  revoke insert, update, delete, truncate, references, trigger, maintain on tables from authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
-- EXECUTE de PUBLIC em função nova é padrão do Postgres e só se desfaz no nível global do dono.
alter default privileges for role postgres revoke execute on functions from public;

-- ---------------------------------------------------------------------------
-- Sequência do número de pedido (PED-0001...)
-- ---------------------------------------------------------------------------
create sequence public.order_number_seq start 1 increment 1 minvalue 1 maxvalue 9223372036854775807 cache 1;

-- ---------------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id uuid not null
);

create table public.colors (
  id uuid not null default gen_random_uuid(),
  name text not null,
  hex_code text not null,
  created_at timestamp with time zone default now()
);

create table public.customers (
  id uuid not null default gen_random_uuid(),
  name text not null,
  company_name text,
  cnpj text,
  phone text,
  email text,
  created_at timestamp with time zone default now()
);

create table public.defect_stock (
  id uuid not null default gen_random_uuid(),
  product_id uuid not null,
  color_id uuid not null,
  size_id uuid not null,
  quantity integer not null default 0,
  defect_price numeric not null,
  reason text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.expenses (
  id uuid not null default gen_random_uuid(),
  categoria text not null,
  subcategoria text,
  valor numeric not null,
  data_competencia date not null,
  data_pagamento date,
  recorrente boolean not null default false,
  recurring_expense_id uuid,
  observacao text,
  created_at timestamp with time zone not null default now()
);

create table public.order_items (
  id uuid not null default gen_random_uuid(),
  order_id uuid,
  product_id uuid,
  color_id uuid,
  size_id uuid,
  quantity integer not null,
  unit_price numeric not null
);

create table public.orders (
  id uuid not null default gen_random_uuid(),
  order_number text not null,
  customer_id uuid,
  status text not null default 'aguardando_pagamento'::text,
  payment_provider text,
  payment_id text,
  shipping_address jsonb,
  total numeric not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  payment_method text,
  paid_at timestamp with time zone
);

create table public.product_colors (
  id uuid not null default gen_random_uuid(),
  product_id uuid not null,
  color_id uuid not null,
  created_at timestamp with time zone default now(),
  photo_url text
);

create table public.product_media (
  id uuid not null default gen_random_uuid(),
  product_id uuid not null,
  type text not null,
  url text not null,
  storage_path text not null,
  "position" integer not null default 0,
  created_at timestamp with time zone not null default now()
);

create table public.production_runs (
  id uuid not null default gen_random_uuid(),
  product_id uuid not null,
  custo_total numeric not null,
  quantidade_produzida integer not null,
  quantidade_distribuida integer not null default 0,
  data date not null default CURRENT_DATE,
  created_at timestamp with time zone not null default now(),
  custo_itens jsonb
);

create table public.products (
  id uuid not null default gen_random_uuid(),
  sku text not null,
  name text not null,
  category text,
  material text,
  price numeric(10,2) not null,
  price_original numeric(10,2),
  discount_percentage numeric(5,2),
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  featured boolean not null default false,
  tag text,
  instagram_urls text[] not null default '{}'::text[],
  is_launch boolean not null default false,
  custo numeric
);

create table public.recurring_expenses (
  id uuid not null default gen_random_uuid(),
  categoria text not null,
  subcategoria text,
  valor numeric not null,
  dia_geracao integer not null default 1,
  ativo boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.sizes (
  id uuid not null default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone not null default now()
);

create table public.stock (
  id uuid not null default gen_random_uuid(),
  product_id uuid not null,
  size_id uuid not null,
  quantity integer not null default 0,
  reserved integer not null default 0,
  created_at timestamp with time zone not null default now(),
  color_id uuid,
  min_threshold integer not null default 6,
  barcode text
);

create table public.store_settings (
  id uuid not null default gen_random_uuid(),
  name text not null default 'Minha loja'::text,
  agent_name text not null default 'Atendente'::text,
  whatsapp text,
  instagram text,
  min_order integer not null default 6,
  updated_at timestamp with time zone not null default now(),
  facebook text,
  pix_key text,
  pix_name text,
  pix_city text
);

-- ---------------------------------------------------------------------------
-- Chaves primárias, únicas e checagens
-- ---------------------------------------------------------------------------
alter table public.admins add constraint admins_pkey PRIMARY KEY (user_id);
alter table public.colors add constraint colors_hex_code_check CHECK ((hex_code ~ '^#[0-9A-Fa-f]{6}$'::text));
alter table public.colors add constraint colors_name_key UNIQUE (name);
alter table public.colors add constraint colors_pkey PRIMARY KEY (id);
alter table public.customers add constraint customers_pkey PRIMARY KEY (id);
alter table public.defect_stock add constraint defect_stock_defect_price_check CHECK ((defect_price > (0)::numeric));
alter table public.defect_stock add constraint defect_stock_pkey PRIMARY KEY (id);
alter table public.defect_stock add constraint defect_stock_product_id_color_id_size_id_key UNIQUE (product_id, color_id, size_id);
alter table public.defect_stock add constraint defect_stock_quantity_check CHECK ((quantity >= 0));
alter table public.expenses add constraint expenses_categoria_check CHECK ((categoria = ANY (ARRAY['producao'::text, 'fixas'::text, 'pessoal'::text, 'comissao'::text, 'logistica'::text, 'marketing'::text, 'outras'::text])));
alter table public.expenses add constraint expenses_pkey PRIMARY KEY (id);
alter table public.expenses add constraint expenses_valor_check CHECK ((valor > (0)::numeric));
alter table public.order_items add constraint order_items_pkey PRIMARY KEY (id);
alter table public.orders add constraint orders_order_number_key UNIQUE (order_number);
alter table public.orders add constraint orders_pkey PRIMARY KEY (id);
alter table public.product_colors add constraint product_colors_pkey PRIMARY KEY (id);
alter table public.product_colors add constraint product_colors_product_id_color_id_key UNIQUE (product_id, color_id);
alter table public.product_media add constraint product_media_pkey PRIMARY KEY (id);
alter table public.product_media add constraint product_media_type_check CHECK ((type = ANY (ARRAY['image'::text, 'video'::text])));
alter table public.production_runs add constraint production_runs_custo_total_check CHECK ((custo_total > (0)::numeric));
alter table public.production_runs add constraint production_runs_distribuida_limite CHECK ((quantidade_distribuida <= quantidade_produzida));
alter table public.production_runs add constraint production_runs_pkey PRIMARY KEY (id);
alter table public.production_runs add constraint production_runs_quantidade_distribuida_check CHECK ((quantidade_distribuida >= 0));
alter table public.production_runs add constraint production_runs_quantidade_produzida_check CHECK ((quantidade_produzida > 0));
alter table public.products add constraint products_discount_percentage_check CHECK (((discount_percentage >= (0)::numeric) AND (discount_percentage <= (100)::numeric)));
alter table public.products add constraint products_pkey PRIMARY KEY (id);
alter table public.products add constraint products_sku_key UNIQUE (sku);
alter table public.recurring_expenses add constraint recurring_expenses_categoria_check CHECK ((categoria = ANY (ARRAY['producao'::text, 'fixas'::text, 'pessoal'::text, 'comissao'::text, 'logistica'::text, 'marketing'::text, 'outras'::text])));
alter table public.recurring_expenses add constraint recurring_expenses_dia_geracao_check CHECK (((dia_geracao >= 1) AND (dia_geracao <= 28)));
alter table public.recurring_expenses add constraint recurring_expenses_pkey PRIMARY KEY (id);
alter table public.recurring_expenses add constraint recurring_expenses_valor_check CHECK ((valor > (0)::numeric));
alter table public.sizes add constraint sizes_name_key UNIQUE (name);
alter table public.sizes add constraint sizes_pkey PRIMARY KEY (id);
alter table public.stock add constraint stock_barcode_key UNIQUE (barcode);
alter table public.stock add constraint stock_pkey PRIMARY KEY (id);
alter table public.stock add constraint stock_product_color_size_key UNIQUE (product_id, color_id, size_id);
alter table public.stock add constraint stock_quantity_check CHECK ((quantity >= 0));
alter table public.stock add constraint stock_reserved_check CHECK ((reserved >= 0));
alter table public.store_settings add constraint store_settings_min_order_check CHECK ((min_order >= 1));
alter table public.store_settings add constraint store_settings_pkey PRIMARY KEY (id);

-- ---------------------------------------------------------------------------
-- Chaves estrangeiras
-- ---------------------------------------------------------------------------
alter table public.admins add constraint admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.defect_stock add constraint defect_stock_color_id_fkey FOREIGN KEY (color_id) REFERENCES colors(id);
alter table public.defect_stock add constraint defect_stock_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id);
alter table public.defect_stock add constraint defect_stock_size_id_fkey FOREIGN KEY (size_id) REFERENCES sizes(id);
alter table public.expenses add constraint expenses_recurring_expense_id_fkey FOREIGN KEY (recurring_expense_id) REFERENCES recurring_expenses(id) ON DELETE SET NULL;
alter table public.order_items add constraint order_items_color_id_fkey FOREIGN KEY (color_id) REFERENCES colors(id);
alter table public.order_items add constraint order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
alter table public.order_items add constraint order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id);
alter table public.order_items add constraint order_items_size_id_fkey FOREIGN KEY (size_id) REFERENCES sizes(id);
alter table public.orders add constraint orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id);
alter table public.product_colors add constraint product_colors_color_id_fkey FOREIGN KEY (color_id) REFERENCES colors(id) ON DELETE CASCADE;
alter table public.product_colors add constraint product_colors_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
alter table public.product_media add constraint product_media_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
alter table public.production_runs add constraint production_runs_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id);
alter table public.stock add constraint stock_color_id_fkey FOREIGN KEY (color_id) REFERENCES colors(id);
alter table public.stock add constraint stock_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
alter table public.stock add constraint stock_size_id_fkey FOREIGN KEY (size_id) REFERENCES sizes(id) ON DELETE RESTRICT;

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------
CREATE INDEX customers_phone_idx ON public.customers USING btree (phone);
CREATE INDEX defect_stock_color_id_idx ON public.defect_stock USING btree (color_id);
CREATE INDEX defect_stock_size_id_idx ON public.defect_stock USING btree (size_id);
CREATE INDEX expenses_data_competencia_idx ON public.expenses USING btree (data_competencia);
CREATE INDEX expenses_recurring_expense_id_idx ON public.expenses USING btree (recurring_expense_id);
CREATE INDEX idx_stock_product_size ON public.stock USING btree (product_id, size_id);
CREATE INDEX idx_stock_size_id ON public.stock USING btree (size_id);
CREATE INDEX order_items_color_id_idx ON public.order_items USING btree (color_id);
CREATE INDEX order_items_order_id_idx ON public.order_items USING btree (order_id);
CREATE INDEX order_items_product_id_idx ON public.order_items USING btree (product_id);
CREATE INDEX order_items_size_id_idx ON public.order_items USING btree (size_id);
CREATE INDEX orders_created_at_idx ON public.orders USING btree (created_at DESC);
CREATE INDEX orders_customer_id_idx ON public.orders USING btree (customer_id);
CREATE INDEX orders_status_idx ON public.orders USING btree (status);
CREATE INDEX product_colors_color_id_idx ON public.product_colors USING btree (color_id);
CREATE INDEX product_media_product_id_idx ON public.product_media USING btree (product_id);
CREATE INDEX production_runs_product_id_idx ON public.production_runs USING btree (product_id);
CREATE INDEX stock_color_id_idx ON public.stock USING btree (color_id);
CREATE INDEX stock_product_id_idx ON public.stock USING btree (product_id);

-- ---------------------------------------------------------------------------
-- Funções
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_payment_and_decrement_stock(p_order_id uuid, p_payment_id text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_claimed uuid;
  v_item record;
begin
  update orders
  set status = 'pago', payment_id = p_payment_id, paid_at = coalesce(paid_at, now())
  where id = p_order_id
    and status <> 'pago'
  returning id into v_claimed;

  if v_claimed is null then
    return 'already_paid';
  end if;

  for v_item in
    select product_id, color_id, size_id, sum(quantity) as qty
    from order_items
    where order_id = p_order_id
    group by product_id, color_id, size_id
  loop
    update stock
    set quantity = quantity - v_item.qty
    where product_id = v_item.product_id
      and color_id is not distinct from v_item.color_id
      and size_id = v_item.size_id;

    if not found then
      raise exception 'stock row not found for product % color % size %',
        v_item.product_id, v_item.color_id, v_item.size_id;
    end if;
  end loop;

  return 'ok';
end;
$function$
;

CREATE OR REPLACE FUNCTION public.distribute_production_run(p_run_id uuid, p_items jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_run record;
  v_item record;
  v_total integer := 0;
begin
  select id, product_id, quantidade_produzida, quantidade_distribuida
  into v_run
  from production_runs
  where id = p_run_id
  for update;

  if v_run is null then
    raise exception 'lote não encontrado: %', p_run_id;
  end if;

  select coalesce(sum((x.quantity)::integer), 0) into v_total
  from jsonb_to_recordset(p_items) as x(color_id uuid, size_id uuid, quantity integer, barcode text);

  if v_total <= 0 then
    raise exception 'distribuição vazia ou inválida';
  end if;

  if v_run.quantidade_distribuida + v_total > v_run.quantidade_produzida then
    raise exception 'distribuição (%) excede o restante do lote (%)',
      v_total, v_run.quantidade_produzida - v_run.quantidade_distribuida;
  end if;

  for v_item in select * from jsonb_to_recordset(p_items) as x(color_id uuid, size_id uuid, quantity integer, barcode text)
  loop
    if v_item.color_id is null or v_item.size_id is null or v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'linha de distribuição inválida: %', v_item;
    end if;

    insert into product_colors (product_id, color_id)
    values (v_run.product_id, v_item.color_id)
    on conflict (product_id, color_id) do nothing;

    insert into stock (product_id, color_id, size_id, quantity, barcode)
    values (v_run.product_id, v_item.color_id, v_item.size_id, v_item.quantity, v_item.barcode)
    on conflict (product_id, color_id, size_id)
    do update set quantity = stock.quantity + excluded.quantity;
  end loop;

  update production_runs
  set quantidade_distribuida = quantidade_distribuida + v_total
  where id = p_run_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_recurring_expenses()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  insert into expenses (categoria, subcategoria, valor, data_competencia, recorrente, recurring_expense_id)
  select r.categoria, r.subcategoria, r.valor, date_trunc('month', current_date)::date, true, r.id
  from recurring_expenses r
  where r.ativo = true
    and r.dia_geracao = extract(day from current_date)
    and not exists (
      select 1 from expenses e
      where e.recurring_expense_id = r.id
        and e.data_competencia = date_trunc('month', current_date)::date
    );
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$ select exists (select 1 from public.admins where user_id = (select auth.uid())) $function$
;

CREATE OR REPLACE FUNCTION public.next_order_number()
 RETURNS text
 LANGUAGE sql
 SET search_path TO 'public', 'pg_temp'
AS $function$ select 'PED-' || lpad(nextval('order_number_seq')::text, 4, '0') $function$
;

CREATE OR REPLACE FUNCTION public.sync_product_custo_from_production_run()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  update products
  set custo = round(new.custo_total / new.quantidade_produzida, 2),
      updated_at = now()
  where id = new.product_id;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_order_status_and_restore_stock(p_order_id uuid, p_expected_status text, p_novo_status text, p_must_restore boolean)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_updated_id uuid;
  v_item record;
begin
  update orders
  set status = p_novo_status,
      paid_at = case when p_novo_status = 'pago' then coalesce(paid_at, now()) else paid_at end
  where id = p_order_id
    and status = p_expected_status
  returning id into v_updated_id;

  if v_updated_id is null then
    return 'conflict';
  end if;

  if p_must_restore then
    for v_item in
      select product_id, color_id, size_id, sum(quantity) as qty
      from order_items
      where order_id = p_order_id
      group by product_id, color_id, size_id
    loop
      update stock
      set quantity = quantity + v_item.qty
      where product_id = v_item.product_id
        and color_id is not distinct from v_item.color_id
        and size_id = v_item.size_id;

      if not found then
        raise exception 'stock row not found for product % color % size %', v_item.product_id, v_item.color_id, v_item.size_id;
      end if;
    end loop;
  end if;

  return 'ok';
end;
$function$
;

-- Só o painel logado chama is_admin() (as regras de acesso dependem dela); as demais
-- funções são chamadas só pelo servidor (service_role) e já nascem sem EXECUTE pelo padrão acima.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.is_admin() to authenticated;

CREATE TRIGGER production_run_sync_custo AFTER INSERT ON public.production_runs FOR EACH ROW EXECUTE FUNCTION sync_product_custo_from_production_run();

-- ---------------------------------------------------------------------------
-- View pública de estoque: mostra só o status, nunca a quantidade.
-- security_invoker = off é intencional (anon não tem SELECT em stock.quantity).
-- ---------------------------------------------------------------------------
create view public.estoque_status_publico with (security_invoker = off) as
 SELECT product_id,
    color_id,
    size_id,
        CASE
            WHEN quantity <= 0 THEN 'esgotado'::text
            WHEN quantity <= min_threshold THEN 'baixo'::text
            ELSE 'ok'::text
        END AS status
   FROM stock;

-- ---------------------------------------------------------------------------
-- RLS e policies
-- ---------------------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.colors enable row level security;
alter table public.customers enable row level security;
alter table public.defect_stock enable row level security;
alter table public.expenses enable row level security;
alter table public.order_items enable row level security;
alter table public.orders enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_media enable row level security;
alter table public.production_runs enable row level security;
alter table public.products enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.sizes enable row level security;
alter table public.stock enable row level security;
alter table public.store_settings enable row level security;

-- admins e defect_stock ficam sem policy de propósito: só o servidor (service_role) acessa.
create policy public_read_colors on public.colors as permissive for select to public
  using (true);
create policy admin_reads_customers on public.customers as permissive for select to authenticated
  using (( SELECT is_admin() AS is_admin));
create policy "admin reads expenses" on public.expenses as permissive for select to authenticated
  using (( SELECT is_admin() AS is_admin));
create policy admin_reads_order_items on public.order_items as permissive for select to authenticated
  using (( SELECT is_admin() AS is_admin));
create policy admin_reads_orders on public.orders as permissive for select to authenticated
  using (( SELECT is_admin() AS is_admin));
create policy public_read_product_colors on public.product_colors as permissive for select to public
  using (true);
create policy "admin deletes product_media_row" on public.product_media as permissive for delete to authenticated
  using (( SELECT is_admin() AS is_admin));
create policy "admin writes product_media" on public.product_media as permissive for insert to authenticated
  with check (( SELECT is_admin() AS is_admin));
create policy "public reads product_media" on public.product_media as permissive for select to public
  using (true);
create policy "admin reads production_runs" on public.production_runs as permissive for select to authenticated
  using (( SELECT is_admin() AS is_admin));
create policy public_read_products on public.products as permissive for select to public
  using (true);
create policy "admin reads recurring_expenses" on public.recurring_expenses as permissive for select to authenticated
  using (( SELECT is_admin() AS is_admin));
create policy public_read_sizes on public.sizes as permissive for select to public
  using (true);
create policy public_read_stock on public.stock as permissive for select to public
  using (true);
create policy "public reads store_settings" on public.store_settings as permissive for select to public
  using (true);

-- ---------------------------------------------------------------------------
-- Permissões (além do RLS)
-- Loja pública (anon): lê só o que a vitrine usa. Painel (authenticated): lê tudo (o RLS exige
-- is_admin) e escreve direto só em product_media; o resto passa pela API.
-- ---------------------------------------------------------------------------
revoke insert, update, delete, truncate, references, trigger, maintain on all tables in schema public from anon, authenticated;
grant insert, delete on public.product_media to authenticated;
revoke select on public.admins from authenticated;

grant select on public.colors, public.product_colors, public.product_media, public.sizes, public.store_settings to anon;

-- Colunas internas ficam fora do alcance público: products.custo; stock.quantity/reserved/min_threshold/barcode.
grant select (category, created_at, description, discount_percentage, featured, id, instagram_urls, is_active, is_launch, material, name, price, price_original, sku, tag, updated_at) on public.products to anon;
grant select (color_id, id, product_id, size_id) on public.stock to anon;

revoke all on public.estoque_status_publico from anon, authenticated;
grant select on public.estoque_status_publico to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime (fila de pedidos ao vivo no painel)
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.orders;

-- ---------------------------------------------------------------------------
-- Storage: bucket público de fotos e vídeos de produto; só admin envia e apaga
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-media', 'product-media', true, 26214400,
  '{image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm}')
on conflict (id) do nothing;

create policy "admin deletes product-media" on storage.objects as permissive for delete to authenticated
  using (((bucket_id = 'product-media'::text) AND ( SELECT is_admin() AS is_admin)));
create policy "admin uploads product-media" on storage.objects as permissive for insert to authenticated
  with check (((bucket_id = 'product-media'::text) AND ( SELECT is_admin() AS is_admin)));

-- ---------------------------------------------------------------------------
-- Despesas fixas: gera as do mês todo dia às 03:00 (UTC)
-- ---------------------------------------------------------------------------
select cron.schedule('generate-recurring-expenses-daily', '0 3 * * *', 'select generate_recurring_expenses();');
