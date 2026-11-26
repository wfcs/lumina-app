-- =============================================================================
-- Lumina — Fase 0: modelo de dados (ver docs/mapa_visor.md §12–§14)
-- Idempotente: pode rodar mais de uma vez. Só ADICIONA (tabelas, colunas,
-- restrições, funções); não altera nem apaga dados existentes.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Funções puras de ciclo e cartão (RN-01, RN-04, RN-06)
-- ---------------------------------------------------------------------------

-- Ciclo que contém `ref`, começando no dia `start_day` (1..28).
create or replace function public.cycle_bounds(ref date, start_day int)
returns table (cycle_start date, cycle_end date)
language sql immutable set search_path = '' as $$
  with s as (
    select case
      when extract(day from ref)::int >= start_day
        then make_date(extract(year from ref)::int, extract(month from ref)::int, start_day)
      else (make_date(extract(year from ref)::int, extract(month from ref)::int, start_day) - interval '1 month')::date
    end as d
  )
  select d, (d + interval '1 month' - interval '1 day')::date from s
$$;

-- Mês (1º dia) da fatura em que cai uma compra feita em `purchase`.
-- Compra até o dia de fechamento (inclusive) entra na fatura do próprio mês;
-- fechamento maior que o último dia do mês = último dia do mês.
create or replace function public.card_bill_month(purchase date, closing_day int)
returns date
language sql immutable set search_path = '' as $$
  select case
    when extract(day from purchase)::int
         <= least(closing_day, extract(day from (date_trunc('month', purchase) + interval '1 month - 1 day'))::int)
      then date_trunc('month', purchase)::date
    else (date_trunc('month', purchase) + interval '1 month')::date
  end
$$;

-- Melhor dia de compra = dia seguinte ao fechamento (31 → 1).
create or replace function public.best_purchase_day(closing_day int)
returns int
language sql immutable set search_path = '' as $$ select (closing_day % 31) + 1 $$;

-- ---------------------------------------------------------------------------
-- 2. Configurações do usuário (RN-01, RN-04, RN-12)
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cycle_start_day int not null default 1 check (cycle_start_day between 1 and 28),
  card_regime text not null default 'competencia' check (card_regime in ('competencia', 'caixa')),
  monthly_limit numeric check (monthly_limit is null or monthly_limit >= 0),
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Categorias: tipo (despesa/receita), tipo de gasto, cor, ordem (RN-11)
-- ---------------------------------------------------------------------------
alter table public.user_categories add column if not exists kind text not null default 'expense';
alter table public.user_categories add column if not exists spend_type text;
alter table public.user_categories add column if not exists color text;
alter table public.user_categories add column if not exists hidden boolean not null default false;
alter table public.user_categories add column if not exists sort_order int not null default 0;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'user_categories_kind_chk') then
    alter table public.user_categories add constraint user_categories_kind_chk check (kind in ('expense', 'income'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_categories_spend_type_chk') then
    alter table public.user_categories add constraint user_categories_spend_type_chk
      check (spend_type is null or spend_type in ('fixo', 'controlavel', 'variavel'));
  end if;
end $$;

-- Orçamento por categoria e mês (RN-12)
create table if not exists public.category_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.user_categories(id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  limit_amount numeric not null check (limit_amount >= 0),
  unique (user_id, category_id, month)
);

-- ---------------------------------------------------------------------------
-- 4. Tags
-- ---------------------------------------------------------------------------
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  color text,
  created_at timestamptz not null default now()
);
create unique index if not exists tags_user_name_uq on public.tags (user_id, lower(name));

-- ---------------------------------------------------------------------------
-- 5. Recorrências (RN-08) e planos de parcelas manuais (RN-07)
-- ---------------------------------------------------------------------------
create table if not exists public.recurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'expense' check (kind in ('expense', 'income')),
  description text not null,
  match_pattern text,
  category_id uuid references public.user_categories(id) on delete set null,
  account_id uuid references public.accounts(id) on delete set null,
  amount numeric not null check (amount >= 0),
  frequency text not null default 'monthly' check (frequency in ('weekly', 'monthly', 'yearly')),
  day_of_month int check (day_of_month is null or day_of_month between 1 and 31),
  start_date date,
  end_date date,
  active boolean not null default true,
  origin text not null default 'manual' check (origin in ('manual', 'detected')),
  created_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table if not exists public.installment_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  category_id uuid references public.user_categories(id) on delete set null,
  description text not null,
  installment_amount numeric not null check (installment_amount > 0),
  installments_total int not null check (installments_total >= 2),
  first_date date not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. Transações: colunas novas (RN-07, RN-09, RN-11, split)
-- ---------------------------------------------------------------------------
alter table public.transactions add column if not exists ignored boolean not null default false;
alter table public.transactions add column if not exists notes text;
alter table public.transactions add column if not exists original_description text;
alter table public.transactions add column if not exists installment_number int;
alter table public.transactions add column if not exists installment_total int;
alter table public.transactions add column if not exists recurrence_id uuid references public.recurrences(id) on delete set null;
alter table public.transactions add column if not exists source text not null default 'openfinance';
alter table public.transactions add column if not exists split_parent_id uuid references public.transactions(id) on delete cascade;
alter table public.transactions add column if not exists spend_type text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'transactions_installment_chk') then
    alter table public.transactions add constraint transactions_installment_chk check (
      (installment_number is null and installment_total is null)
      or (installment_total >= 2 and installment_number between 1 and installment_total));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'transactions_source_chk') then
    alter table public.transactions add constraint transactions_source_chk
      check (source in ('openfinance', 'manual', 'import'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'transactions_spend_type_chk') then
    alter table public.transactions add constraint transactions_spend_type_chk
      check (spend_type is null or spend_type in ('fixo', 'controlavel', 'variavel'));
  end if;
end $$;

create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);

create table if not exists public.transaction_tags (
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (transaction_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- 7. Regras de automação (RN-13)
--    conditions: [{ "field": "name|original_name|amount|category|account|card|date",
--                   "op": "contains|equals|gt|lt|between", "value": ... }]
--    actions:    { "category_id"?: uuid, "tag_ids"?: [uuid], "ignore"?: bool }
-- ---------------------------------------------------------------------------
create table if not exists public.rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  priority int not null default 0,
  enabled boolean not null default true,
  conditions jsonb not null default '[]' check (jsonb_typeof(conditions) = 'array'),
  actions jsonb not null default '{}' check (jsonb_typeof(actions) = 'object'),
  created_at timestamptz not null default now()
);
create index if not exists rules_user_priority_idx on public.rules (user_id, priority);

-- ---------------------------------------------------------------------------
-- 8. Cartões: faturas (RN-05)
-- ---------------------------------------------------------------------------
create table if not exists public.card_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  provider_bill_id text unique,
  reference_month date not null check (extract(day from reference_month) = 1),
  closing_date date,
  due_date date,
  total_amount numeric not null default 0,
  minimum_payment numeric,
  status text not null default 'open' check (status in ('open', 'closed', 'paid', 'overdue')),
  updated_at timestamptz not null default now()
);
create index if not exists card_bills_account_month_idx on public.card_bills (account_id, reference_month);
-- card_settings (fechamento/vencimento) já existe com checagem 1..31 — sem mudança.

-- ---------------------------------------------------------------------------
-- 9. Metas
-- ---------------------------------------------------------------------------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  moment text,
  target_amount numeric not null check (target_amount > 0),
  current_amount numeric not null default 0 check (current_amount >= 0),
  target_date date,
  status text not null default 'active' check (status in ('active', 'ready', 'done', 'archived')),
  is_emergency_reserve boolean not null default false,
  focus boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.goal_allocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  amount numeric not null check (amount >= 0),
  unique (goal_id, month)
);

-- ---------------------------------------------------------------------------
-- 10. Patrimônio: investimentos, dívidas e fotografias diárias (RN-15)
-- ---------------------------------------------------------------------------
create table if not exists public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid references public.connections(id) on delete cascade,
  provider_id text unique,
  name text not null,
  type text not null default 'other',
  subtype text,
  balance numeric not null default 0,
  indexer text,
  rate numeric,
  due_date date,
  source text not null default 'manual' check (source in ('openfinance', 'manual')),
  updated_at timestamptz not null default now()
);

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid references public.connections(id) on delete cascade,
  provider_id text unique,
  name text not null,
  type text not null default 'other',
  outstanding_balance numeric not null default 0 check (outstanding_balance >= 0),
  installment_amount numeric,
  installments_total int,
  installments_paid int,
  rate numeric,
  due_date date,
  source text not null default 'manual' check (source in ('openfinance', 'manual')),
  updated_at timestamptz not null default now()
);

create table if not exists public.patrimony_snapshots (
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot_date date not null,
  assets numeric not null default 0,
  debts numeric not null default 0,
  primary key (user_id, snapshot_date)
);

-- ---------------------------------------------------------------------------
-- 11. RLS: cada usuário só vê e grava as próprias linhas
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'user_settings', 'category_budgets', 'tags', 'transaction_tags', 'rules', 'recurrences',
    'installment_plans', 'card_bills', 'goals', 'goal_allocations', 'investments', 'debts',
    'patrimony_snapshots'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = t || '_own') then
      execute format(
        'create policy %I on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
        t || '_own', t);
    end if;
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 12. Backfill: transações vindas de extrato OFX/CSV (id "manual:...") = origem import
-- ---------------------------------------------------------------------------
update public.transactions
   set source = 'import'
 where source = 'openfinance' and pluggy_transaction_id like 'manual:%';
