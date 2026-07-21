"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Money } from "@/components/ui/money";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { DbAccount, DbTransaction, DbConnection, UserCategory } from "@/lib/data";
import { brl } from "@/lib/format";
import { makeResolver } from "@/lib/cat-resolve";
import { ArrowRight, ArrowUpRight, Command, Sparkles, Wallet } from "lucide-react";

const PALETTE = ["#7C3AED", "#D7B8F3", "#4FCE9A", "#B8B8F3", "#A855F7", "#4FCE9A", "#F4B860", "#F0839F", "#0EA5E9", "#EAB308"];
const pad = (n: number) => String(n).padStart(2, "0");
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function DashboardReal({ accounts, transactions, connections, categories }: { accounts: DbAccount[]; transactions: DbTransaction[]; connections: DbConnection[]; categories: UserCategory[] }) {
  const resolver = makeResolver(categories);
  const emojiById = new Map(categories.map((c) => [c.id, c.emoji]));
  const connById = new Map(connections.map((c) => [c.id, c]));
  const isCredit = (a: DbAccount) => (a.type ?? "").toUpperCase() === "CREDIT";

  const ativos = accounts.filter((a) => !isCredit(a)).reduce((s, a) => s + a.balance, 0);
  const dividas = accounts.filter(isCredit).reduce((s, a) => s + Math.abs(a.balance), 0);
  const patrimonio = ativos - dividas;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const month = todayStr.slice(0, 7);
  const monthLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const monthTx = transactions.filter((t) => t.date.startsWith(month) && t.date <= todayStr);

  const income = monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const delta = income - expense;
  const ratio = income > 0 ? (expense / income) * 100 : null;
  const savingsRate = income > 0 ? delta / income : 0;

  // Score de saúde (0–100) a partir da taxa de poupança do mês
  const hasIncome = income > 0;
  const score = hasIncome ? Math.round(clamp01(savingsRate) * 100) : null;
  const health = score === null
    ? { tone: "var(--muted)", label: "Sem dados", note: "Sem receita registrada no mês." }
    : score >= 70
    ? { tone: "var(--mint)", label: "Boa", note: "Você está guardando bem neste mês." }
    : score >= 45
    ? { tone: "var(--warn)", label: "Atenção", note: "Dá pra apertar os gastos variáveis." }
    : { tone: "var(--danger)", label: "Alerta", note: "Gastos altos frente à renda do mês." };

  // Distribuição por categoria — top 4
  const catMap = new Map<string, number>();
  monthTx.filter((t) => t.amount < 0).forEach((t) => {
    const k = resolver.parentLabel(t);
    catMap.set(k, (catMap.get(k) ?? 0) + Math.abs(t.amount));
  });
  const byCat = Array.from(catMap.entries())
    .map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] }))
    .sort((a, b) => b.value - a.value);
  const topCats = byCat.slice(0, 4);
  const catMax = Math.max(...topCats.map((c) => c.value), 1);

  // Fatura de cartão — maior utilização
  const creditAccts = accounts.filter(isCredit);
  const bill = creditAccts
    .map((a) => ({ a, used: Math.abs(a.balance), limit: a.credit_limit ?? 0 }))
    .sort((x, y) => y.used - x.used)[0];
  const billConn = bill ? connById.get(bill.a.connection_id) : undefined;
  const billUse = bill && bill.limit > 0 ? bill.used / bill.limit : null;

  // Contas líquidas — top 3
  const contas = accounts.filter((a) => !isCredit(a)).sort((a, b) => b.balance - a.balance).slice(0, 3);

  // Recentes — 4 últimas do mês
  const recent = [...monthTx].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  // Fluxo de caixa — últimos 6 meses
  const flow = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    const mtx = transactions.filter((t) => t.date.startsWith(key));
    return {
      label,
      in: mtx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
      out: mtx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
    };
  });
  const flowMax = Math.max(...flow.flatMap((f) => [f.in, f.out]), 1);

  // Sparkline de patrimônio — saldo acumulado das transações dos últimos ~45 dias,
  // ancorado para terminar no patrimônio atual
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 45);
  const fromStr = `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`;
  const periodTx = transactions.filter((t) => t.date >= fromStr).sort((a, b) => a.date.localeCompare(b.date));
  const periodNet = periodTx.reduce((s, t) => s + t.amount, 0);
  let running = patrimonio - periodNet;
  const nwSeries = [{ i: 0, value: Math.round(running) }, ...periodTx.map((t, idx) => {
    running += t.amount;
    return { i: idx + 1, value: Math.round(running) };
  })];
  const nwFirst = nwSeries[0].value;
  const nwLast = nwSeries[nwSeries.length - 1].value;
  const patrimonioDelta = nwFirst !== 0 ? ((nwLast - nwFirst) / Math.abs(nwFirst)) * 100 : 0;

  // Meta · Reserva de emergência = 6 meses de despesa mensal
  const reservaCurrent = ativos;
  const reservaTarget = expense > 0 ? expense * 6 : 0;
  const reservaPct = reservaTarget > 0 ? (reservaCurrent / reservaTarget) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* Topbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Olá, Felipe 👋</h1>
          <p className="text-muted text-sm mt-1 capitalize">Sua clareza financeira · {monthLabel} · {connections.length} {connections.length === 1 ? "conexão" : "conexões"}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-muted">
          <Command size={14} /> Buscar ou executar…
          <kbd className="ml-1 rounded-md border border-[var(--border)] bg-[var(--card-2)] px-1.5 text-[11px]">⌘K</kbd>
        </div>
      </div>

      {/* HERO — Saúde financeira */}
      <div className="card p-5 animate-fade-up relative overflow-hidden">
        <div className="orb h-72 w-72 -top-24 -right-16" style={{ background: "radial-gradient(circle, #7C3AED, transparent 70%)" }} />
        <div className="relative grid lg:grid-cols-[1.3fr_1fr] gap-6 items-center">
          <div>
            <Badge tone={delta >= 0 ? "positive" : "danger"}>{delta >= 0 ? "No azul este mês" : "No vermelho este mês"}</Badge>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted mt-4 mb-1.5">Patrimônio líquido</p>
            <Money value={patrimonio} gradient glow className="text-5xl font-bold leading-none" />
            <p className="text-sm text-muted mt-3 max-w-md">
              {hasIncome
                ? <>Você guardou <span className="text-[var(--mint)] font-semibold num">{Math.round(savingsRate * 100)}%</span> da renda do mês. {ratio !== null && <>Sua razão gasto/receita é <span className="num font-semibold text-[var(--text)]">{ratio.toFixed(0)}%</span>.</>}</>
                : "Ainda sem receita registrada neste mês para calcular a taxa de poupança."}
            </p>
            <div className="grid grid-cols-3 gap-3 mt-5 max-w-md">
              <Chip label="Entradas" value={income} tone="mint" />
              <Chip label="Saídas" value={-expense} tone="danger" />
              <Chip label="Poupado" plain={hasIncome ? `${Math.round(savingsRate * 100)}%` : "—"} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <HealthRing score={score} tone={health.tone} />
            <p className="text-sm text-muted text-center max-w-[200px]">
              <span className="font-semibold" style={{ color: health.tone }}>{health.label}.</span> {health.note}
            </p>
          </div>
        </div>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">

        {/* Patrimônio */}
        <BentoCard span="lg:col-span-2" title="Patrimônio total"
          action={<Badge tone={patrimonioDelta >= 0 ? "positive" : "danger"}><ArrowUpRight size={12} /> {patrimonioDelta.toFixed(1)}%</Badge>}>
          <Money value={patrimonio} className="text-3xl font-bold" />
          <div className="h-14 -mx-1 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={nwSeries}>
                <defs><linearGradient id="pt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient></defs>
                <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2.5} fill="url(#pt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-muted mt-1">Ativos {brl(ativos)} · Dívidas {brl(dividas)}</p>
        </BentoCard>

        {/* Fatura */}
        <BentoCard span="lg:col-span-2" title="Fatura do cartão">
          {!bill ? (
            <p className="text-sm text-muted py-6 text-center">Nenhum cartão de crédito conectado.</p>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <InstDot conn={billConn} />
                <span className="text-xs font-semibold truncate">{bill.a.name || billConn?.institution_name || "Cartão"}</span>
              </div>
              <Money value={bill.used} className="text-2xl font-bold" />
              {billUse !== null ? (
                <>
                  <Progress value={billUse * 100} className="mt-3" />
                  <p className="text-[11px] text-muted mt-1.5 num">{Math.round(billUse * 100)}% de {brl(bill.limit)}</p>
                </>
              ) : (
                <p className="text-[11px] text-muted mt-2">Sem limite informado</p>
              )}
            </>
          )}
        </BentoCard>

        {/* Meta · Reserva de emergência */}
        <BentoCard span="lg:col-span-2" title="Meta · Reserva">
          {reservaTarget <= 0 ? (
            <>
              <Money value={reservaCurrent} className="text-2xl font-bold" />
              <p className="text-[11px] text-muted mt-2">Reserva líquida atual. Registre despesas para calcular a meta de 6 meses.</p>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5">
                <Money value={reservaCurrent} className="text-2xl font-bold" />
                <span className="text-sm text-muted num">/ {brl(reservaTarget)}</span>
              </div>
              <Progress value={reservaCurrent} max={reservaTarget} className="mt-3" />
              <p className="text-[11px] text-muted mt-1.5 num">{Math.round(reservaPct)}% de 6 meses de despesa 🛟</p>
            </>
          )}
        </BentoCard>

        {/* Contas */}
        <BentoCard span="lg:col-span-3" title="Contas" action={<span className="text-muted text-[11px] font-medium">Open Finance</span>}>
          {contas.length === 0 ? (
            <p className="text-sm text-muted py-6 text-center">Nenhuma conta conectada.</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {contas.map((a) => {
                const conn = connById.get(a.connection_id);
                return (
                  <div key={a.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <InstDot conn={conn} size={34} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{a.name || conn?.institution_name || "Conta"}</div>
                      <div className="text-[11px] text-muted truncate">{conn?.institution_name ?? "—"}</div>
                    </div>
                    <Money value={a.balance} className="ml-auto font-bold" />
                  </div>
                );
              })}
            </div>
          )}
        </BentoCard>

        {/* Fluxo de caixa */}
        <BentoCard span="lg:col-span-3" title="Fluxo de caixa" action={<span className="text-muted text-[11px] font-medium">6 meses</span>}>
          <div className="flex items-end gap-2.5 h-[130px] mt-1">
            {flow.map((f, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="flex items-end gap-1 h-full">
                  <motion.div className="w-2.5 rounded-t-md" style={{ background: "var(--mint)" }}
                    initial={{ height: 0 }} animate={{ height: `${(f.in / flowMax) * 100}%` }} transition={{ duration: 0.7, ease: "easeOut" }} />
                  <motion.div className="w-2.5 rounded-t-md" style={{ background: "var(--danger)", opacity: 0.85 }}
                    initial={{ height: 0 }} animate={{ height: `${(f.out / flowMax) * 100}%` }} transition={{ duration: 0.7, ease: "easeOut" }} />
                </div>
                <span className="text-[11px] text-muted capitalize">{f.label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-xs text-muted mt-2">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm" style={{ background: "var(--mint)" }} />Entradas</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm" style={{ background: "var(--danger)" }} />Saídas</span>
          </div>
        </BentoCard>

        {/* Categorias */}
        <BentoCard span="lg:col-span-4" title="Gastos por categoria" action={<Link href="/categories" className="text-[var(--accent)] text-xs font-semibold flex items-center gap-1">Ver <ArrowRight size={12} /></Link>}>
          {topCats.length === 0 ? (
            <p className="text-sm text-muted py-6 text-center">Sem gastos neste mês ainda.</p>
          ) : (
            <div className="space-y-3.5 mt-1">
              {topCats.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.color, boxShadow: `0 0 10px ${c.color}66` }} />
                  <span className="text-sm font-semibold w-28 truncate">{c.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-[var(--card-2)] overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: c.color }}
                      initial={{ width: 0 }} animate={{ width: `${(c.value / catMax) * 100}%` }} transition={{ duration: 1, ease: "easeOut" }} />
                  </div>
                  <Money value={c.value} className="text-sm text-muted w-24 text-right" />
                </div>
              ))}
            </div>
          )}
        </BentoCard>

        {/* Recentes */}
        <BentoCard span="lg:col-span-2" title="Recentes" action={<Link href="/transactions" className="text-[var(--accent)] text-xs font-semibold">Ver →</Link>}>
          {recent.length === 0 ? (
            <p className="text-sm text-muted py-6 text-center">Nenhuma transação neste mês.</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {recent.map((t) => {
                const emoji = t.category_id ? emojiById.get(t.category_id) : null;
                return (
                  <div key={t.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="grid place-items-center h-9 w-9 rounded-lg text-base bg-[var(--card-2)] text-muted shrink-0">{emoji || <Wallet size={15} />}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{t.description || "—"}</div>
                      <div className="text-[11px] text-muted truncate">{resolver.label(t)}</div>
                    </div>
                    <Money value={t.amount} colorize className="ml-auto font-bold text-sm" />
                  </div>
                );
              })}
            </div>
          )}
        </BentoCard>

        {/* Insight */}
        <Link href="/transactions" className="lg:col-span-6 card p-5 animate-fade-up relative overflow-hidden text-[#F2ECFA]"
          style={{ background: "linear-gradient(135deg,#7C3AED,#1F1832)" }}>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-85 mb-3">
            <Sparkles size={14} /> Insight
          </div>
          <p className="text-sm leading-relaxed max-w-2xl">
            {topCats.length > 0
              ? <>Sua maior despesa do mês é <b className="text-[#D7B8F3]">{topCats[0].name}</b> ({brl(topCats[0].value)}). Definir um limite ajuda a manter o resultado no azul.</>
              : <>Conecte mais contas ou registre transações para receber <b className="text-[#D7B8F3]">insights personalizados</b> sobre seus gastos.</>}
          </p>
          <p className="text-xs opacity-80 mt-3 flex items-center gap-1">Ver transações <ArrowRight size={13} /></p>
        </Link>
      </div>
    </div>
  );
}

function HealthRing({ score, tone }: { score: number | null; tone: string }) {
  const R = 78, C = 2 * Math.PI * R;
  const val = score ?? 0;
  const offset = C - (C * val) / 100;
  return (
    <div className="relative h-[168px] w-[168px]">
      <svg width="168" height="168" viewBox="0 0 180 180" className="-rotate-90">
        <circle cx="90" cy="90" r={R} fill="none" stroke="var(--card-2)" strokeWidth="14" />
        <motion.circle cx="90" cy="90" r={R} fill="none" stroke={tone} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.3, ease: [0.2, 0.8, 0.2, 1] }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="num text-4xl font-bold leading-none">{score ?? "—"}</div>
          <div className="text-[11px] text-muted mt-1">saúde</div>
        </div>
      </div>
    </div>
  );
}

function Chip({ label, value, tone, plain }: { label: string; value?: number; tone?: "mint" | "danger"; plain?: string }) {
  const color = tone === "mint" ? "text-[var(--mint)]" : tone === "danger" ? "text-danger" : "";
  return (
    <div className="rounded-xl bg-[var(--card-2)] px-3 py-2.5">
      <div className="text-[11px] text-muted">{label}</div>
      {plain !== undefined
        ? <div className="text-lg font-bold num mt-0.5">{plain}</div>
        : <Money value={value ?? 0} className={`text-lg font-bold mt-0.5 ${color}`} />}
    </div>
  );
}

function InstDot({ conn, size = 20 }: { conn?: DbConnection; size?: number }) {
  const name = conn?.institution_name ?? "";
  if (conn?.institution_image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={conn.institution_image} alt={name} className="rounded-lg shrink-0 object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded-lg grid place-items-center text-white shrink-0 font-bold bg-[var(--accent)]"
      style={{ width: size, height: size, fontSize: size * 0.45 }} title={name || "Conta"}>
      {(name || "•").charAt(0).toUpperCase()}
    </div>
  );
}

function BentoCard({ span, title, action, children }: { span?: string; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={`card p-5 animate-fade-up ${span ?? ""}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold text-muted uppercase tracking-[0.14em]">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
