"use client";
import Link from "next/link";
import {
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis,
} from "recharts";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import type { DbAccount, DbTransaction, DbConnection } from "@/lib/data";
import { brl } from "@/lib/format";
import { categoryPtBr } from "@/lib/categories-ptbr";
import { ArrowRight, TrendingUp, Wallet } from "lucide-react";

const tt = { background: "#1C1C22", border: "1px solid #2C2C34", borderRadius: 12, color: "#EAEEF6", fontSize: 12 };
const PALETTE = ["#8332AC", "#E086D3", "#B8EBD0", "#F2D1C9", "#9D4EDD", "#5FBF96", "#F4B860", "#FF6B7A"];

export function DashboardReal({ accounts, transactions, connections }: { accounts: DbAccount[]; transactions: DbTransaction[]; connections: DbConnection[] }) {
  const isCredit = (a: DbAccount) => (a.type ?? "").toUpperCase() === "CREDIT";
  const ativos = accounts.filter((a) => !isCredit(a)).reduce((s, a) => s + a.balance, 0);
  const dividas = accounts.filter(isCredit).reduce((s, a) => s + Math.abs(a.balance), 0);
  const patrimonio = ativos - dividas;

  const months = Array.from(new Set(transactions.map((t) => t.date.slice(0, 7)))).sort();
  const month = months[months.length - 1] ?? new Date().toISOString().slice(0, 7);
  const monthLabel = new Date(month + "-01T00:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const monthTx = transactions.filter((t) => t.date.startsWith(month));
  const income = monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const net = income - expense;

  // gasto acumulado por dia
  const daysInMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  let acc = 0;
  const daily = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dstr = `${month}-${String(day).padStart(2, "0")}`;
    acc += monthTx.filter((t) => t.date === dstr && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    return { day, acc: Math.round(acc) };
  });

  // por categoria
  const catMap = new Map<string, number>();
  monthTx.filter((t) => t.amount < 0).forEach((t) => {
    const k = categoryPtBr(t.category);
    catMap.set(k, (catMap.get(k) ?? 0) + Math.abs(t.amount));
  });
  const byCat = Array.from(catMap.entries()).map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] })).sort((a, b) => b.value - a.value).slice(0, 7);

  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Olá, Felipe 👋</h1>
          <p className="text-muted text-sm mt-1 capitalize">Sua clareza financeira · {monthLabel}</p>
        </div>
        <div className="text-right">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted">Patrimônio líquido</div>
          <Money value={patrimonio} className="text-xl font-bold" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Gasto do mês */}
        <Card className="lg:col-span-2 overflow-hidden relative">
          <div className="orb h-64 w-64 -top-16 -right-10" style={{ background: "radial-gradient(circle, #8332AC, transparent 70%)" }} />
          <div className="orb h-56 w-56 top-10 right-32 animate-float" style={{ background: "radial-gradient(circle, #E086D3, transparent 70%)" }} />
          <div className="relative">
            <CardTitle>Gasto do mês</CardTitle>
            <Money value={expense} gradient glow className="text-5xl font-bold leading-none" />
            <p className="text-sm text-muted mb-4 mt-1">{monthTx.length} transações em {monthLabel}</p>
            <div className="h-40 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sp" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#8332AC" /><stop offset="100%" stopColor="#E086D3" /></linearGradient>
                    <linearGradient id="spf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8332AC" stopOpacity={0.25} /><stop offset="100%" stopColor="#E086D3" stopOpacity={0} /></linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#5d6679" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tt} formatter={(v: number) => [brl(v), "Acumulado"]} labelFormatter={(l) => `Dia ${l}`} />
                  <Area type="monotone" dataKey="acc" stroke="url(#sp)" strokeWidth={3} fill="url(#spf)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Resultado do mês */}
        <Card className="flex flex-col">
          <CardTitle action={<Badge tone={net >= 0 ? "positive" : "danger"}>{net >= 0 ? "Positivo" : "Negativo"}</Badge>}>Resultado do mês</CardTitle>
          <Money value={net} colorize className="text-4xl font-bold leading-none" />
          <div className="mt-auto pt-5 space-y-3">
            <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-muted"><span className="h-2 w-2 rounded-full bg-[var(--mint)]" />Receita</span><Money value={income} className="text-[var(--mint)] font-semibold" /></div>
            <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-muted"><span className="h-2 w-2 rounded-full bg-[var(--danger,#FF6B7A)]" />Gasto</span><Money value={-expense} className="text-danger font-semibold" /></div>
          </div>
        </Card>

        {/* Donut categorias */}
        <Card className="lg:col-span-2">
          <CardTitle>Distribuição de gastos</CardTitle>
          {byCat.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">Sem gastos categorizados neste mês ainda.</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative h-52 w-52 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCat} dataKey="value" innerRadius={64} outerRadius={86} paddingAngle={3} stroke="none" cornerRadius={6}>
                      {byCat.map((c) => <Cell key={c.name} fill={c.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tt} formatter={(v: number) => brl(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 grid place-items-center pointer-events-none text-center">
                  <div><div className="text-[10px] uppercase tracking-[0.14em] text-muted">Gasto</div><Money value={expense} className="font-bold text-lg" /></div>
                </div>
              </div>
              <div className="flex-1 w-full space-y-1">
                {byCat.map((c) => (
                  <div key={c.name} className="flex items-center gap-2.5 text-sm px-2 py-1.5">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.color, boxShadow: `0 0 10px ${c.color}66` }} />
                    <span className="flex-1 truncate">{c.name}</span>
                    <Money value={c.value} className="font-semibold" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Patrimônio */}
        <Card>
          <CardTitle>Patrimônio</CardTitle>
          <Money value={patrimonio} className="text-3xl font-bold" />
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Ativos</span><Money value={ativos} className="text-[var(--mint)] font-medium" /></div>
            <div className="flex justify-between"><span className="text-muted">Dívidas (cartões)</span><Money value={-dividas} className="text-danger font-medium" /></div>
          </div>
        </Card>

        {/* Transações recentes */}
        <Card className="lg:col-span-3">
          <CardTitle action={<Link href="/transactions" className="text-[var(--accent)] text-xs font-semibold flex items-center gap-1">Ver todas <ArrowRight size={12} /></Link>}>Transações recentes</CardTitle>
          <div className="divide-y divide-[var(--border)]">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="grid place-items-center h-8 w-8 rounded-lg bg-[var(--card-2)] text-muted shrink-0"><Wallet size={15} /></span>
                <span className="flex-1 truncate">{t.description || "—"}</span>
                <span className="text-muted text-xs hidden sm:block">{categoryPtBr(t.category)}</span>
                <span className="text-muted text-xs num">{new Date(t.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                <Money value={t.amount} colorize className="font-semibold w-28 text-right" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
