-- Base SOMENTE PARA TESTE: reproduz o mínimo do Supabase (schema auth, papéis)
-- e as tabelas que já existem em produção, com as colunas que o código usa hoje
-- (inferidas de src/lib/data.ts, src/server/sync.ts e actions). Não é migração.

create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
end $$;
grant usage on schema auth to authenticated, anon;
grant usage on schema public to authenticated, anon;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tax_id text, onboarded boolean default false, plan text, trial_ends_at timestamptz
);

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pluggy_item_id text unique not null,
  institution_name text, institution_image text,
  status text, last_sync_at timestamptz,
  created_at timestamptz default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid references public.connections(id) on delete cascade,
  pluggy_account_id text unique not null,
  type text, subtype text, name text, number text,
  balance numeric default 0, credit_limit numeric, currency text default 'BRL'
);

create table public.user_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.user_categories(id) on delete cascade,
  name text not null, emoji text, is_default boolean default false,
  created_at timestamptz default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  pluggy_transaction_id text unique,
  description text, amount numeric not null, type text, date date not null,
  category text, category_id uuid references public.user_categories(id) on delete set null,
  currency text default 'BRL'
);

create table public.card_settings (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  closing_day int not null, due_day int not null,
  updated_at timestamptz default now()
);

grant select, insert, update, delete on all tables in schema public to authenticated;
