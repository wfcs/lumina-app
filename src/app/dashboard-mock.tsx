"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, ReferenceLine, Tooltip, XAxis,
} from "recharts";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Money } from "@/components/ui/money";
import { InstLogo } from "@/components/ui/inst-logo";
import {
  spendLimit, dailySpend, insights, spendByParentCategory, totalIncome, totalExpense,
  netWorthHistory, bills, goals, recurring, accounts,
} from "@/lib/mock-data";
import { brl } from "@/lib/format";
import { ArrowRight, TrendingUp, ArrowUpRight } from "lucide-react";

const tt = { background: "#1C1C22", border: "1px solid #2C2C34", borderRadius: 12, color: "#EAEEF6", fontSize: 12 };

export function DashboardMock() {
  const spent = dailySpend[dailySpend.length - 1].acc;
  const overLimit = spent > spendLimit;
  const remaining = spendLimit - spent;
  const income = totalIncome();
  const expense = totalExpense();
  const net = income - expense;
  const byCat = spendByParentCategory();
  const totalBills = bills.reduce((s, b) => s + b.total, 0);
  const dueThisWeek = recurring.filter((r) => {
    const d = new Date(r.nextDueDate), now = new Date("2026-06-16");
    const diff = (d.getTime() - now.getTime()) / 86400000;
    return diff >= -2 && diff <= 6;
  });

  return (
    <div className="space-y-5">
      {/* Saudação */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Olá, Felipe 👋</h1>
          <p className="text-muted text-sm mt-1">Aqui está sua clareza financeira de junho de 2026.</p>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted">Patrimônio líquido</div>
          <Money value={netWorthHistory[netWorthHistory.length - 1].value} className="text-xl font-bold" />
        </div>
      </div>

      <Carousel />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* HERO — Gasto do mês */}
        <Card className="lg:col-span-2 overflow-hidden relative">
          <div className="orb h-64 w-64 -top-16 -right-10" style={{ background: "radial-gradient(circle, #8332AC, transparent 70%)" }} />
          <div className="orb h-56 w-56 top-10 right-32 animate-float" style={{ background: "radial-gradient(circle, #E086D3, transparent 70%)" }} />
          <div className="relative">
            <div className="flex items-center justify-between">
              <CardTitle>Gasto do mês</CardTitle>
              <Badge tone={overLimit ? "danger" : "positive"}>{overLimit ? `${brl(spent - spendLimit)} acima` : `${brl(remaining)} disponível`}</Badge>
            </div>
            <div className="flex items-end gap-3 mb-1">
              <Money value={spent} gradient glow className="text-5xl font-bold leading-none" />
            </div>
            <p className="text-sm text-muted mb-4">de <span className="text-[var(--text)] font-semibold num">{brl(spendLimit)}</span> de limite mensal · {Math.round((spent / spendLimit) * 100)}% usado</p>
            <div className="h-44 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailySpend} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spend" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8332AC" /><stop offset="100%" stopColor="#E086D3" />
                    </linearGradient>
                    <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8332AC" stopOpacity={0.25} /><stop offset="100%" stopColor="#E086D3" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#5d6679" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tt} formatter={(v: number) => [brl(v), "Acumulado"]} labelFormatter={(l) => `Dia ${l}`} />
                  <ReferenceLine y={spendLimit} stroke="#FF6B7A" strokeDasharray="4 4" strokeOpacity={0.6} />
                  <Area type="monotone" dataKey="acc" stroke="url(#spend)" strokeWidth={3} fill="url(#spendFill)" dot={false} activeDot={{ r: 4, fill: "#E086D3" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Resultado parcial */}
        <Card className="flex flex-col">
          <CardTitle action={<Badge tone="positive"><TrendingUp size={12} /> +55,8%</Badge>}>Resultado parcial</CardTitle>
          <Money value={net} colorize className="text-4xl font-bold leading-none" />
          <p className="text-xs text-muted mt-1">vs. R$ 3.120 no mês anterior</p>
          <div className="mt-auto pt-5 space-y-3">
            <Stat label="Receita" value={income} tone="mint" />
            <Stat label="Gasto" value={-expense} tone="danger" />
          </div>
        </Card>

        {/* Donut categorias */}
        <Card className="lg:col-span-2">
          <CardTitle>Distribuição de gastos</CardTitle>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative h-52 w-52 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCat} dataKey="value" innerRadius={64} outerRadius={86} paddingAngle={3} stroke="none" cornerRadius={6}>
                    {byCat.map((c) => <Cell key={c.id} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tt} formatter={(v: number) => brl(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center pointer-events-none text-center">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted">Gasto em Jun</div>
                  <Money value={expense} className="font-bold text-lg" />
                </div>
              </div>
            </div>
            <div className="flex-1 w-full space-y-1">
              {byCat.slice(0, 6).map((c) => {
                const over = c.limit ? c.value > c.limit : false;
                return (
                  <Link key={c.id} href={`/transactions?cat=${c.id}`} className="flex items-center gap-2.5 text-sm rounded-lg px-2 py-1.5 hover:bg-white/[0.03] transition-colors">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.color, boxShadow: `0 0 10px ${c.color}66` }} />
                    <span className="flex-1 truncate">{c.emoji} {c.name}</span>
                    <Money value={c.value} className={over ? "text-danger font-semibold" : "font-semibold"} />
                    {c.limit && <span className="text-muted text-xs num w-20 text-right">/ {brl(c.limit)}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Patrimônio */}
        <Card>
          <CardTitle action={<Badge tone="positive"><ArrowUpRight size={12} /> 6,9%</Badge>}>Patrimônio</CardTitle>
          <Money value={netWorthHistory[netWorthHistory.length - 1].value} className="text-3xl font-bold" />
          <div className="h-16 mt-3 -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={netWorthHistory}>
                <defs><linearGradient id="nw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#B8EBD0" stopOpacity={0.35} /><stop offset="100%" stopColor="#B8EBD0" stopOpacity={0} /></linearGradient></defs>
                <Area type="monotone" dataKey="value" stroke="#B8EBD0" strokeWidth={2.5} fill="url(#nw)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-sm text-[var(--mint)] mt-2 font-medium">+ R$ 7.500 neste mês</p>
        </Card>

        {/* Faturas */}
        <Card className="lg:col-span-2">
          <CardTitle action={<Link href="/bills" className="text-[var(--accent)] text-xs font-semibold flex items-center gap-1">Ver faturas <ArrowRight size={12} /></Link>}>Faturas do mês</CardTitle>
          <div className="flex items-end gap-2 mb-4">
            <Money value={totalBills} className="text-2xl font-bold" />
            <span className="text-xs text-muted mb-1">parcelas · recorrentes · avulsos</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {bills.map((b) => {
              const acc = accounts.find((a) => a.id === b.accountId);
              const used = acc?.creditUsed ?? 0, limit = acc?.creditLimit ?? 1;
              return (
                <div key={b.accountId} className="rounded-xl border border-[var(--border)] bg-[var(--card-2)] p-3.5">
                  <div className="flex items-center gap-2 mb-2"><InstLogo id={b.institutionId} size={22} /><span className="text-xs font-semibold truncate">{b.cardName}</span></div>
                  <Money value={b.total} className="font-bold" />
                  <Progress value={used} max={limit} className="mt-2.5" />
                  <p className="text-[11px] text-muted mt-1.5 num">{Math.round((used / limit) * 100)}% de {brl(limit)}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Contas a pagar */}
        <Card>
          <CardTitle action={<Link href="/recurring" className="text-[var(--accent)] text-xs font-semibold">Ver →</Link>}>Contas a pagar</CardTitle>
          <p className="text-sm text-muted mb-3">{dueThisWeek.length} vencendo até 22/06</p>
          <div className="space-y-2.5">
            {dueThisWeek.slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-center gap-2.5 text-sm">
                <InstLogo id={r.institutionId} size={24} />
                <span className="flex-1 truncate">{r.emoji} {r.name}</span>
                <Money value={-r.amount} className="text-danger font-semibold" />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-between text-sm font-semibold">
            <span>Total</span><Money value={-dueThisWeek.reduce((s, r) => s + r.amount, 0)} className="text-danger" />
          </div>
        </Card>

        {/* Metas */}
        <Card className="lg:col-span-3">
          <CardTitle action={<Link href="/goals" className="text-[var(--accent)] text-xs font-semibold">Gerenciar →</Link>}>Metas</CardTitle>
          <div className="grid sm:grid-cols-3 gap-4">
            {goals.map((g) => {
              const p = (g.current / g.target) * 100;
              return (
                <div key={g.id} className="rounded-xl border border-[var(--border)] bg-[var(--card-2)] p-4">
                  <div className="flex items-center justify-between mb-2.5"><span className="font-semibold text-sm">{g.emoji} {g.name}</span><span className="text-xs num text-[var(--mint)] font-semibold">{Math.round(p)}%</span></div>
                  <Progress value={g.current} max={g.target} />
                  <div className="flex justify-between text-xs mt-2.5"><Money value={g.current} className="font-semibold" /><span className="text-muted num">de {brl(g.target)}</span></div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "mint" | "danger" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-muted">
        <span className="h-2 w-2 rounded-full" style={{ background: tone === "mint" ? "var(--mint)" : "var(--danger,#FF6B7A)" }} />{label}
      </span>
      <Money value={value} className={tone === "mint" ? "text-[var(--mint)] font-semibold" : "text-danger font-semibold"} />
    </div>
  );
}

function Carousel() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % insights.length), 5000);
    return () => clearInterval(t);
  }, []);
  const cur = insights[i];
  return (
    <Link href={cur.href} className="block card overflow-hidden relative p-0">
      <div className="orb h-32 w-32 -top-6 left-10 opacity-30" style={{ background: "radial-gradient(circle, #8332AC, transparent 70%)" }} />
      <div className="relative px-5 py-4">
        <AnimatePresence mode="wait">
          <motion.div key={cur.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.35 }} className="flex items-center gap-3">
            <span className="grid place-items-center h-10 w-10 rounded-xl text-xl shrink-0 border border-[var(--border)] bg-[var(--card-2)]">{cur.icon}</span>
            <span className="flex-1 font-medium text-sm">{cur.text}</span>
            <ArrowRight size={16} className="text-muted shrink-0" />
          </motion.div>
        </AnimatePresence>
        <div className="flex gap-1.5 mt-3">
          {insights.map((_, idx) => <span key={idx} className={`h-1 rounded-full transition-all duration-300 ${idx === i ? "w-7 bg-[var(--mint)]" : "w-1.5 bg-white/15"}`} />)}
        </div>
      </div>
    </Link>
  );
}
