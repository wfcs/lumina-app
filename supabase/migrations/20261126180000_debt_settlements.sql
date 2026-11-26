-- Baixas de dívidas: liga uma fatura, parcela ou amortização à transação que a pagou.
-- Só registro (o app não paga nada). Baixas automáticas são calculadas na hora e não ficam aqui;
-- esta tabela guarda as escolhas manuais e as recusas ("não é esta transação").
create table if not exists public.debt_settlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('bill', 'installment', 'amortization')),
  -- bill: "<account_id>:<due_date>" · installment: "<debt_id>:<AAAA-MM>" · amortization: "<debt_id>"
  target_key text not null,
  transaction_id uuid references public.transactions (id) on delete cascade,
  amount numeric(14, 2),
  source text not null default 'manual' check (source in ('manual', 'rejected')),
  created_at timestamptz not null default now(),
  constraint debt_settlements_tx_required check (source = 'rejected' or transaction_id is not null)
);

-- Uma fatura/parcela tem no máximo uma baixa manual; amortizações podem ser várias.
create unique index if not exists debt_settlements_one_per_target
  on public.debt_settlements (user_id, kind, target_key) where kind <> 'amortization';
create index if not exists debt_settlements_user on public.debt_settlements (user_id);

alter table public.debt_settlements enable row level security;
create policy debt_settlements_own on public.debt_settlements
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
