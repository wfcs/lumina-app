"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Money } from "@/components/ui/money";
import { InstLogo } from "@/components/ui/inst-logo";
import {
  spendLimit, dailySpend, spendByParentCategory, totalIncome, totalExpense,
  netWorthHistory, goals, accounts, bills, transactions, monthlyResults, catById,
} from "@/lib/mock-data";
import { brl } from "@/lib/format";
import { ArrowRight, ArrowUpRight, Command, Sparkles } from "lucide-react";

const NOW = new Date("2026-06-16");

export function DashboardMock() {
  const spent = dailySpend[dailySpend.length - 1].acc;
  const income = totalIncome();
  const expense = totalExpense();
  const net = income - expense;
  const savingsRate = income > 0 ? net / income : 0;
  const limitUse = spent / spendLimit;

  // Saldo em caixa (contas líquidas) + projeção da sobra do mês
  const caixa = accounts
    .filter((a) => a.type === "checking" || a.type === "savings")
    .reduce((s, a) => s + a.balance, 0);
  const saldoProjetado = caixa + net;

  // Score de saúde financeira (0–100)
  const score = Math.max(
    0, Math.min(100, Math.round((clamp01(savingsRate) * 0.6 + (1 - clamp01(limitUse)) * 0.4) * 100))
  );
  const health = score >= 70
    ? { tone: "var(--mint)", label: "Boa", note: "Gastos sob controle, reserva crescendo." }
    : score >= 45
    ? { tone: "var(--warn)", label: "Atenção", note: "Dá pra apertar os gastos variáveis." }
    : { tone: "var(--danger)", label: "Alerta", note: "Gastos altos frente à renda do mês." };

  const patrimonio = netWorthHistory[netWorthHistory.length - 1].value;
  const patrimonioIni = netWorthHistory[0].value;
  const patrimonioDelta = ((patrimonio - patrimonioIni) / patrimonioIni) * 100;

  const byCat = spendByParentCategory().slice(0, 4);
  const catMax = Math.max(...byCat.map((c) => c.value), 1);

  // Fatura mais próxima do vencimento
  const nextBill = [...bills].sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))[0];
  const billAcc = accounts.find((a) => a.id === nextBill.accountId);
  const billDays = Math.max(0, Math.round((+new Date(nextBill.dueDate) - +NOW) / 86400000));
  const billUse = billAcc ? (billAcc.creditUsed ?? 0) / (billAcc.creditLimit ?? 1) : 0;

  const meta = goals[0];
  const metaPct = (meta.current / meta.target) * 100;

  const contas = accounts
    .filter((a) => a.type === "checking" || a.type === "savings")
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 3);

  const recentes = [...transactions].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 4);

  // Fluxo de caixa 6 meses (entrada fixa aproximada vs saída = entrada − resultado)
  const RENDA = 12500;
  const flow = monthlyResults.map((m, i) => ({
    label: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"][i] ?? m.month.slice(5),
    in: RENDA,
    out: RENDA - m.net,
  }));
  const flowMax = Math.max(...flow.flatMap((f) => [f.in, f.out]), 1);

  return (
    <div className="space-y-5">
      {/* Topbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Bom dia, Felipe 👋</h1>
          <p className="text-muted text-sm mt-1">Sua clareza financeira de junho de 2026 · 5 conexões via Open Finance</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-muted">
          <Command size={14} /> Buscar ou executar…
          <kbd className="ml-1 rounded-md border border-[var(--border)] bg-[var(--card-2)] px-1.5 text-[11px]">⌘K</kbd>
        </div>
      </div>

      {/* HERO — Saúde financeira */}
      <Card className="relative overflow-hidden">
        <div className="orb h-72 w-72 -top-24 -right-16" style={{ background: "radial-gradient(circle, #7C3AED, transparent 70%)" }} />
        <div className="relative grid lg:grid-cols-[1.3fr_1fr] gap-6 items-center">
          <div>
            <Badge tone={net >= 0 ? "positive" : "danger"}>{net >= 0 ? "No azul este mês" : "No vermelho este mês"}</Badge>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted mt-4 mb-1.5">Saldo projetado no fim do mês</p>
            <Money value={saldoProjetado} gradient glow className="text-5xl font-bold leading-none" />
            <p className="text-sm text-muted mt-3 max-w-md">
              Você guardou <span className="text-[var(--mint)] font-semibold num">{Math.round(savingsRate * 100)}%</span> da
              renda do mês. Mantendo o ritmo, sobra para a meta <span className="text-[var(--text)] font-semibold">{meta.name}</span>.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-5 max-w-md">
              <Chip label="Entradas" value={income} tone="mint" />
              <Chip label="Saídas" value={-expense} tone="danger" />
              <Chip label="Poupado" plain={`${Math.round(savingsRate * 100)}%`} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <HealthRing score={score} tone={health.tone} />
            <p className="text-sm text-muted text-center max-w-[200px]">
              <span className="font-semibold" style={{ color: health.tone }}>{health.label}.</span> {health.note}
            </p>
          </div>
        </div>
      </Card>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-5">

        {/* Patrimônio */}
        <BentoCard span="lg:col-span-2" title="Patrimônio total"
          action={<Badge tone="positive"><ArrowUpRight size={12} /> {patrimonioDelta.toFixed(1)}%</Badge>}>
          <Money value={patrimonio} className="text-3xl font-bold" />
          <div className="h-14 -mx-1 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthHistory}>
                <defs><linearGradient id="pt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient></defs>
                <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2.5} fill="url(#pt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </BentoCard>

        {/* Fatura */}
        <BentoCard span="lg:col-span-2" title="Fatura do cartão">
          <div className="flex items-center gap-2 mb-1">
            <InstLogo id={nextBill.institutionId} size={20} />
            <span className="text-xs font-semibold truncate">{nextBill.cardName}</span>
          </div>
          <Money value={nextBill.total} className="text-2xl font-bold" />
          <p className="text-danger text-xs font-semibold mt-1">Vence em {billDays} dias</p>
          <Progress value={billUse * 100} className="mt-3" />
          <p className="text-[11px] text-muted mt-1.5 num">{Math.round(billUse * 100)}% do limite usado</p>
        </BentoCard>

        {/* Meta */}
        <BentoCard span="lg:col-span-2" title={`Meta · ${meta.name}`}>
          <div className="flex items-baseline gap-1.5">
            <Money value={meta.current} className="text-2xl font-bold" />
            <span className="text-sm text-muted num">/ {brl(meta.target)}</span>
          </div>
          <Progress value={meta.current} max={meta.target} className="mt-3" />
          <p className="text-[11px] text-muted mt-1.5 num">{Math.round(metaPct)}% concluído {meta.emoji}</p>
        </BentoCard>

        {/* Contas */}
        <BentoCard span="lg:col-span-3" title="Contas" action={<span className="text-muted text-[11px] font-medium">Open Finance</span>}>
          <div className="divide-y divide-[var(--border)]">
            {contas.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <InstLogo id={a.institutionId} size={34} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{a.name}</div>
                  <div className="text-[11px] text-muted capitalize">{a.type === "savings" ? "Poupança" : "Conta"}</div>
                </div>
                <Money value={a.balance} className="ml-auto font-bold" />
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Fluxo de caixa */}
        <BentoCard span="lg:col-span-3" title="Fluxo de caixa" action={<span className="text-muted text-[11px] font-medium">6 meses</span>}>
          <div className="flex items-end gap-2.5 h-[130px] mt-1">
            {flow.map((f) => (
              <div key={f.label} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <div className="flex items-end gap-1 h-full">
                  <motion.div className="w-2.5 rounded-t-md" style={{ background: "var(--mint)" }}
                    initial={{ height: 0 }} animate={{ height: `${(f.in / flowMax) * 100}%` }} transition={{ duration: 0.7, ease: "easeOut" }} />
                  <motion.div className="w-2.5 rounded-t-md" style={{ background: "var(--danger)", opacity: 0.85 }}
                    initial={{ height: 0 }} animate={{ height: `${(f.out / flowMax) * 100}%` }} transition={{ duration: 0.7, ease: "easeOut" }} />
                </div>
                <span className="text-[11px] text-muted">{f.label}</span>
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
          <div className="space-y-3.5 mt-1">
            {byCat.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="grid place-items-center h-8 w-8 rounded-lg text-base shrink-0 bg-[var(--card-2)]">{c.emoji}</span>
                <span className="text-sm font-semibold w-24 truncate">{c.name}</span>
                <div className="flex-1 h-2 rounded-full bg-[var(--card-2)] overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: c.color }}
                    initial={{ width: 0 }} animate={{ width: `${(c.value / catMax) * 100}%` }} transition={{ duration: 1, ease: "easeOut" }} />
                </div>
                <Money value={c.value} className="text-sm text-muted w-20 text-right" />
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Recentes */}
        <BentoCard span="lg:col-span-2" title="Recentes" action={<Link href="/transactions" className="text-[var(--accent)] text-xs font-semibold">Ver →</Link>}>
          <div className="divide-y divide-[var(--border)]">
            {recentes.map((t) => {
              const cat = catById(t.categoryId);
              return (
                <div key={t.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="grid place-items-center h-9 w-9 rounded-lg text-base bg-[var(--card-2)] shrink-0">{cat?.emoji ?? "💳"}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{t.description}</div>
                    <div className="text-[11px] text-muted truncate">{cat?.name}</div>
                  </div>
                  <Money value={t.amount} colorize className="ml-auto font-bold text-sm" />
                </div>
              );
            })}
          </div>
        </BentoCard>

        {/* Insight */}
        <Link href="/transactions" className="lg:col-span-2 card p-5 animate-fade-up relative overflow-hidden text-[#F2ECFA]"
          style={{ background: "linear-gradient(135deg,#7C3AED,#1F1832)" }}>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-85 mb-3">
            <Sparkles size={14} /> Insight
          </div>
          <p className="text-sm leading-relaxed">
            Seus gastos com <b className="text-[#D7B8F3]">Alimentação</b> subiram este mês. Definir um limite mantém a meta de poupança intacta.
          </p>
          <p className="text-xs opacity-80 mt-3 flex items-center gap-1">Ver transações <ArrowRight size={13} /></p>
        </Link>
      </div>
    </div>
  );
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

function HealthRing({ score, tone }: { score: number; tone: string }) {
  const R = 78, C = 2 * Math.PI * R;
  const offset = C - (C * score) / 100;
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
          <div className="num text-4xl font-bold leading-none">{score}</div>
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
