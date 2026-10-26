-- Dados iniciais de uma loja nova (moda). Rode depois de supabase/migrations/*.
-- Tamanhos e cores são só ponto de partida: a loja cria cores novas pelo painel
-- (Catálogo > Novo produto > + Nova cor) e pode apagar o que não usa.

insert into public.sizes (name) values
  ('P'), ('M'), ('G'), ('GG'), ('XG'), ('XGG'), ('XXG'), ('Unico')
on conflict (name) do nothing;

insert into public.colors (name, hex_code) values
  ('Amarelo', '#D4A82A'), ('Azul', '#3A6B9E'), ('Azul Marinho', '#000080'), ('Bege', '#C8B89A'),
  ('Branco', '#F5F2EE'), ('Caramelo', '#B5743A'), ('Cinza', '#8A8A8A'), ('Colorido', '#B8935A'),
  ('Coral', '#E07A5F'), ('Grafite', '#484848'), ('Jeans', '#3A5A7A'), ('Laranja', '#C97A3A'),
  ('Lilas', '#9B7EC8'), ('Marinho', '#1E3A5F'), ('Marrom', '#6B4226'), ('Musgo', '#5C6B3A'),
  ('Nude', '#C4A882'), ('OffWhite', '#EEEADE'), ('Preto', '#1A1A1A'), ('Rosa', '#E8A0A0'),
  ('Roxo', '#800080'), ('Terracota', '#C16A3A'), ('Verde', '#4A6B3A'), ('Vermelho', '#8B2020'),
  ('Vinho', '#6B2737')
on conflict (name) do nothing;

-- A loja precisa de exatamente uma linha de configuração (o app lê com limit 1).
-- Nome, WhatsApp, Instagram, pedido mínimo e chave Pix são editados na aba Loja do painel.
insert into public.store_settings (name, agent_name)
select 'Minha loja', 'Atendente'
where not exists (select 1 from public.store_settings);
