-- ============================================================================
-- ValAuto — schema inicial (Fase 1)
--
-- Principios:
--  * tipos de veiculo e categorias de avaliacao sao TABELAS, nao enums do
--    Postgres: incluir "moto", "caminhao" ou a categoria "Capacidade off-road"
--    vira INSERT, nao migracao com ALTER TYPE;
--  * specs tecnicas ficam em jsonb, porque os campos variam por tipo;
--  * o agregado (vehicle_rating_summaries) e mantido por trigger, replicando a
--    mesma regra de summarizeVehicleReviews() em packages/shared.
-- ============================================================================

create extension if not exists "pgcrypto";
-- Busca por modelo com similaridade (indice GIN mais abaixo).
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- Helpers
--
-- Só entram aqui funções que não referenciam tabelas: o corpo de uma função
-- `language sql` é analisado na criação, então is_admin() e
-- has_verified_email() vivem logo depois de public.profiles, mais abaixo.
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Usuarios
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  -- Espelho de auth.users.email_confirmed_at: so quem tem este campo
  -- preenchido consegue publicar opiniao (ver policies de reviews).
  email_verified_at timestamptz,
  created_at timestamptz not null default now()
);

comment on column public.profiles.email_verified_at is
  'Espelha auth.users.email_confirmed_at; null => usuario nao pode publicar reviews.';

-- SECURITY DEFINER para poder ler public.profiles de dentro das policies de
-- public.profiles sem recursao de RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.has_verified_email()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.email_verified_at is not null
  );
$$;

-- Cria o profile no cadastro e mantem o status de verificacao em dia.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, avatar_url, email_verified_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    new.email_confirmed_at
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Marca a transacao como update de sistema para passar por guard_profile_columns().
  perform set_config('valauto.system_update', 'on', true);

  update public.profiles
  set email_verified_at = new.email_confirmed_at,
      name = coalesce(new.raw_user_meta_data ->> 'name', name),
      avatar_url = coalesce(new.raw_user_meta_data ->> 'avatar_url', avatar_url)
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function public.handle_user_updated();

-- ---------------------------------------------------------------------------
-- Catalogo
-- ---------------------------------------------------------------------------

create table public.vehicle_types (
  slug text primary key,
  label text not null,
  position integer not null default 0
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  country text,
  created_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  brand_id uuid not null references public.brands (id) on delete restrict,
  type text not null references public.vehicle_types (slug) on update cascade,
  model text not null,
  year integer not null check (year between 1900 and 2100),
  price numeric(12, 2) not null check (price >= 0),
  short_description text,
  description text,
  images text[] not null default '{}',
  -- Campos variam por tipo: powerHp, fuelConsumptionKmL, payloadKg, engineCc...
  specs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_id, model, year)
);

create index vehicles_type_idx on public.vehicles (type);
create index vehicles_brand_idx on public.vehicles (brand_id);
create index vehicles_price_idx on public.vehicles (price);
create index vehicles_year_idx on public.vehicles (year);
-- Busca por marca/modelo sem acento/caixa.
create index vehicles_model_trgm_idx on public.vehicles using gin (model gin_trgm_ops);

create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

create table public.rating_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  -- Vazio => vale para todos os tipos. Permite categoria especifica por tipo.
  applies_to text[] not null default '{}',
  position integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Avaliacoes
-- ---------------------------------------------------------------------------

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  comment text check (char_length(comment) <= 1000),
  status text not null default 'published'
    check (status in ('published', 'pending', 'reported', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 1 opiniao por usuario por veiculo (editavel depois).
  unique (vehicle_id, user_id)
);

create index reviews_vehicle_idx on public.reviews (vehicle_id, status);
create index reviews_user_idx on public.reviews (user_id);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

create table public.review_ratings (
  review_id uuid not null references public.reviews (id) on delete cascade,
  category_id uuid not null references public.rating_categories (id) on delete cascade,
  score numeric(2, 1) not null
    check (score >= 1 and score <= 5 and (score * 2) = floor(score * 2)),
  primary key (review_id, category_id)
);

create table public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null check (char_length(reason) between 5 and 500),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (review_id, reporter_id)
);

create table public.vehicle_rating_summaries (
  vehicle_id uuid primary key references public.vehicles (id) on delete cascade,
  -- { "desempenho": 4.5, "conforto": 4.0, ... }
  category_averages jsonb not null default '{}'::jsonb,
  overall_average numeric(3, 2),
  review_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create index vehicle_summaries_overall_idx
  on public.vehicle_rating_summaries (overall_average desc nulls last);

create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  brand_name text not null,
  model text not null,
  type text not null references public.vehicle_types (slug) on update cascade,
  year integer check (year between 1900 and 2100),
  notes text check (char_length(notes) <= 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index suggestions_status_idx on public.suggestions (status);

-- ---------------------------------------------------------------------------
-- Agregacao das notas
--
-- Mesma regra de packages/shared/src/rating.ts:
--   * so reviews com status 'published' entram;
--   * media por categoria considera apenas quem pontuou a categoria;
--   * media geral = media das medias por categoria (evita que uma categoria
--     com mais notas domine o resultado).
-- ---------------------------------------------------------------------------

create or replace function public.recompute_vehicle_summary(target_vehicle uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  averages jsonb;
  overall numeric(3, 2);
  total integer;
begin
  select count(*) into total
  from public.reviews r
  where r.vehicle_id = target_vehicle and r.status = 'published';

  with per_category as (
    select rc.slug, round(avg(rr.score)::numeric, 1) as category_average
    from public.review_ratings rr
    join public.reviews r on r.id = rr.review_id
    join public.rating_categories rc on rc.id = rr.category_id
    where r.vehicle_id = target_vehicle and r.status = 'published'
    group by rc.slug
  )
  select
    coalesce(jsonb_object_agg(slug, category_average), '{}'::jsonb),
    round(avg(category_average)::numeric, 2)
  into averages, overall
  from per_category;

  insert into public.vehicle_rating_summaries
    (vehicle_id, category_averages, overall_average, review_count, updated_at)
  values (target_vehicle, coalesce(averages, '{}'::jsonb), overall, coalesce(total, 0), now())
  on conflict (vehicle_id) do update
  set category_averages = excluded.category_averages,
      overall_average = excluded.overall_average,
      review_count = excluded.review_count,
      updated_at = now();
end;
$$;

create or replace function public.on_review_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recompute_vehicle_summary(old.vehicle_id);
    return old;
  end if;

  perform public.recompute_vehicle_summary(new.vehicle_id);
  -- Review movida de veiculo (caso raro de correcao administrativa).
  if tg_op = 'UPDATE' and old.vehicle_id is distinct from new.vehicle_id then
    perform public.recompute_vehicle_summary(old.vehicle_id);
  end if;
  return new;
end;
$$;

create trigger reviews_recompute_summary
  after insert or update or delete on public.reviews
  for each row execute function public.on_review_changed();

create or replace function public.on_review_rating_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_review uuid;
  target uuid;
begin
  -- NEW não existe em DELETE (e OLD não existe em INSERT): referenciar o
  -- registro errado levanta "record new is not assigned yet" em plpgsql.
  if tg_op = 'DELETE' then
    target_review := old.review_id;
  else
    target_review := new.review_id;
  end if;

  select r.vehicle_id into target
  from public.reviews r
  where r.id = target_review;

  if target is not null then
    perform public.recompute_vehicle_summary(target);
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger review_ratings_recompute_summary
  after insert or update or delete on public.review_ratings
  for each row execute function public.on_review_rating_changed();

-- Todo veiculo novo ja nasce com uma linha de agregado (zerada).
create or replace function public.on_vehicle_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.vehicle_rating_summaries (vehicle_id)
  values (new.id)
  on conflict (vehicle_id) do nothing;
  return new;
end;
$$;

create trigger vehicles_create_summary
  after insert on public.vehicles
  for each row execute function public.on_vehicle_created();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Leitura do catalogo e publica (navegar/filtrar/comparar nao exige login).
-- Escrita de opiniao exige sessao COM e-mail verificado.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.vehicle_types enable row level security;
alter table public.brands enable row level security;
alter table public.vehicles enable row level security;
alter table public.rating_categories enable row level security;
alter table public.reviews enable row level security;
alter table public.review_ratings enable row level security;
alter table public.review_reports enable row level security;
alter table public.vehicle_rating_summaries enable row level security;
alter table public.suggestions enable row level security;

-- Catalogo: leitura publica, escrita so admin.
create policy "catalogo legivel por todos" on public.vehicle_types for select using (true);
create policy "catalogo legivel por todos" on public.brands for select using (true);
create policy "catalogo legivel por todos" on public.vehicles for select using (true);
create policy "catalogo legivel por todos" on public.rating_categories for select using (true);
create policy "agregados legiveis por todos" on public.vehicle_rating_summaries for select using (true);

create policy "admin gerencia tipos" on public.vehicle_types for all
  using (public.is_admin()) with check (public.is_admin());
create policy "admin gerencia marcas" on public.brands for all
  using (public.is_admin()) with check (public.is_admin());
create policy "admin gerencia veiculos" on public.vehicles for all
  using (public.is_admin()) with check (public.is_admin());
create policy "admin gerencia categorias" on public.rating_categories for all
  using (public.is_admin()) with check (public.is_admin());

-- Profiles: perfil publico (nome/avatar aparecem junto da review).
create policy "perfis legiveis por todos" on public.profiles for select using (true);
create policy "usuario edita o proprio perfil" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "admin gerencia perfis" on public.profiles for all
  using (public.is_admin()) with check (public.is_admin());

-- A policy acima deixa o usuario editar nome/avatar; papel e status de
-- verificacao sao do sistema. Bloqueio via trigger porque uma subquery em
-- public.profiles dentro de uma policy de public.profiles recursaria no RLS.
create or replace function public.guard_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Sincronizacao vinda de auth.users e moderacao do admin passam direto.
  if coalesce(current_setting('valauto.system_update', true), 'off') = 'on' or public.is_admin() then
    return new;
  end if;
  new.role := old.role;
  new.email_verified_at := old.email_verified_at;
  return new;
end;
$$;

create trigger profiles_guard_columns
  before update on public.profiles
  for each row execute function public.guard_profile_columns();

-- Reviews: todos leem as publicadas; o autor le e edita a propria.
create policy "reviews publicadas sao publicas" on public.reviews for select
  using (status = 'published' or user_id = auth.uid() or public.is_admin());

create policy "publicar exige e-mail verificado" on public.reviews for insert
  with check (
    user_id = auth.uid()
    and public.has_verified_email()
    and status = 'published'
  );

create policy "autor edita a propria review" on public.reviews for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and status in ('published', 'removed'));

create policy "autor remove a propria review" on public.reviews for delete
  using (user_id = auth.uid());

create policy "admin modera reviews" on public.reviews for all
  using (public.is_admin()) with check (public.is_admin());

-- Notas por categoria seguem a visibilidade da review-mae.
create policy "notas seguem a review" on public.review_ratings for select
  using (
    exists (
      select 1 from public.reviews r
      where r.id = review_id
        and (r.status = 'published' or r.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "autor grava notas da propria review" on public.review_ratings for all
  using (
    exists (select 1 from public.reviews r where r.id = review_id and r.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.reviews r where r.id = review_id and r.user_id = auth.uid())
    and public.has_verified_email()
  );

-- Denuncias: quem denunciou (e o admin) enxerga.
create policy "denunciante ve a propria denuncia" on public.review_reports for select
  using (reporter_id = auth.uid() or public.is_admin());
create policy "usuario autenticado denuncia" on public.review_reports for insert
  with check (reporter_id = auth.uid() and public.has_verified_email());
create policy "admin resolve denuncias" on public.review_reports for update
  using (public.is_admin()) with check (public.is_admin());

-- Sugestoes: o autor ve a propria; admin ve todas.
create policy "autor ve a propria sugestao" on public.suggestions for select
  using (user_id = auth.uid() or public.is_admin());
create policy "usuario verificado sugere" on public.suggestions for insert
  with check (user_id = auth.uid() and public.has_verified_email() and status = 'pending');
create policy "admin modera sugestoes" on public.suggestions for all
  using (public.is_admin()) with check (public.is_admin());
