"use client";
import Link from "next/link";
import {
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis,
} from "recharts";
import { Card, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import type { DbAccount, DbTransaction, DbConnection, UserCategory } from "@/lib/data";
import { brl } from "@/lib/format";
import { makeResolver } from "@/lib/cat-resolve";
import { ArrowRight, Wallet } from "lucide-react";

const tt = { background: "#2E1B45", border: "1px solid #4A3568", borderRadius: 12, color: "#F1EEF9", fontSize: 12 };
const PALETTE = ["#52528C", "#D7B8F3", "#4FCE9A", "#B8B8F3", "#8888D4", "#37B588", "#F4B860", "#F0839F", "#0EA5E9", "#EAB308"];
const pad = (n: number) => String(n).padStart(2, "0");

export function DashboardReal({ accounts, transactions, connections, categories }: { accounts: DbAccount[]; transactions: DbTransaction[]; connections: DbConnection[]; categories: UserCategory[] }) {
  const resolver = makeResolver(categories);
  const isCredit = (a: DbAccount) => (a.type ?? "").toUpperCase() === "CREDIT";
  const ativos = accounts.filter((a) => !isCredit(a)).reduce((s, a) => s + a.balance, 0);
  const dividas = accounts.filter(isCredit).reduce((s, a) => s + Math.abs(a.balance), 0);
  const patrimonio = ativos - dividas;

  // Mês corrente, limitado até hoje
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const todayDay = now.getDate();
  const month = todayStr.slice(0, 7);
  const monthLabel = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const monthTx = transactions.filter((t) => t.date.startsWith(month) && t.date <= todayStr);

  const income = monthTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  // Resultado (delta Receita - Gasto) + razão Gasto/Receita + variação vs mês anterior
  const delta = income - expense;
  const ratio = income > 0 ? (expense / income) * 100 : null;
  const prevD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prevD.getFullYear()}-${pad(prevD.getMonth() + 1)}`;
  const prevTx = transactions.filter((t) => t.date.startsWith(prevMonth));
  const prevIncome = prevTx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const prevExpense = prevTx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const prevRatio = prevIncome > 0 ? (prevExpense / prevIncome) * 100 : null;
  const ratioVar = ratio !== null && prevRatio !== null ? ratio - prevRatio : null;
  const fmtPct = (v: number, d = 2) => `${v > 0 ? "+" : ""}${v.toFixed(d).replace(".", ",")}%`;

  // Gasto acumulado: dia 1 até hoje
  let acc = 0;
  const daily = Array.from({ length: todayDay }, (_, i) => {
    const day = i + 1;
    const dstr = `${month}-${pad(day)}`;
    acc += monthTx.filter((t) => t.date === dstr && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    return { day, acc: Math.round(acc) };
  });

  // Distribuição por categoria — top 10
  const catMap = new Map<string, number>();
  monthTx.filter((t) => t.amount < 0).forEach((t) => {
    const k = resolver.parentLabel(t);
    catMap.set(k, (catMap.get(k) ?? 0) + Math.abs(t.amount));
  });
  const byCat = Array.from(catMap.entries())
    .map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // 7 últimas do mês corrente
  const recent = [...monthTx].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);

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
        {/* Gasto do mês — dia 1 até hoje */}
        <Card className="lg:col-span-2 overflow-hidden relative">
          <div className="orb h-64 w-64 -top-16 -right-10" style={{ background: "radial-gradient(circle, #52528C, transparent 70%)" }} />
          <div className="orb h-56 w-56 top-10 right-32 animate-float" style={{ background: "radial-gradient(circle, #D7B8F3, transparent 70%)" }} />
          <div className="relative">
            <CardTitle>Gasto do mês</CardTitle>
            <Money value={expense} gradient glow className="text-5xl font-bold leading-none" />
            <p className="text-sm text-muted mb-4 mt-1">{monthTx.length} transações · {monthLabel} (até dia {todayDay})</p>
            <div className="h-40 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sp" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#52528C" /><stop offset="100%" stopColor="#D7B8F3" /></linearGradient>
                    <linearGradient id="spf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#52528C" stopOpacity={0.25} /><stop offset="100%" stopColor="#D7B8F3" stopOpacity={0} /></linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#5d6679" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tt} formatter={(v: number) => [brl(v), "Acumulado"]} labelFormatter={(l) => `Dia ${l}`} />
                  <Area type="monotone" dataKey="acc" stroke="url(#sp)" strokeWidth={3} fill="url(#spf)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Resultado do mês — em % */}
        <Card className="flex flex-col">
          <CardTitle>Resultado do mês</CardTitle>
          <Money value={delta} colorize className="text-4xl font-bold leading-none" />
          <p className="text-sm mt-1.5">
            {ratio === null ? (
              <span className="text-muted">Sem receita no mês</span>
            ) : (
              <>
                <span className="num font-semibold">{ratio.toFixed(1).replace(".", ",")}%</span>
                <span className="text-muted"> Gasto/Receita</span>
                {ratioVar !== null && (
                  <span className={ratioVar > 0 ? "text-danger" : "text-[var(--mint)]"}>{" "}({fmtPct(ratioVar)} vs. mês anterior)</span>
                )}
              </>
            )}
          </p>
          <div className="mt-auto pt-5 space-y-3">
            <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-muted"><span className="h-2 w-2 rounded-full bg-[var(--mint)]" />Receita</span><Money value={income} className="text-[var(--mint)] font-semibold" /></div>
            <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 text-muted"><span className="h-2 w-2 rounded-full" style={{ background: "#F0839F" }} />Gasto</span><Money value={-expense} className="text-danger font-semibold" /></div>
          </div>
        </Card>

        {/* Distribuição por categoria — top 10 */}
        <Card className="lg:col-span-2">
          <CardTitle>Distribuição de gastos · top 10</CardTitle>
          {byCat.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">Sem gastos neste mês ainda.</p>
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

        {/* Patrimônio — mantido */}
        <Card>
          <CardTitle>Patrimônio</CardTitle>
          <Money value={patrimonio} className="text-3xl font-bold" />
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Ativos</span><Money value={ativos} className="text-[var(--mint)] font-medium" /></div>
            <div className="flex justify-between"><span className="text-muted">Dívidas (cartões)</span><Money value={-dividas} className="text-danger font-medium" /></div>
          </div>
        </Card>

        {/* Transações recentes — 7 últimas do mês corrente */}
        <Card className="lg:col-span-3">
          <CardTitle action={<Link href="/transactions" className="text-[var(--accent)] text-xs font-semibold flex items-center gap-1">Ver todas <ArrowRight size={12} /></Link>}>Transações recentes</CardTitle>
          {recent.length === 0 ? (
            <p className="text-sm text-muted py-4 text-center">Nenhuma transação neste mês ainda.</p>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {recent.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="grid place-items-center h-8 w-8 rounded-lg bg-[var(--card-2)] text-muted shrink-0"><Wallet size={15} /></span>
                  <span className="flex-1 truncate">{t.description || "—"}</span>
                  <span className="text-muted text-xs hidden sm:block">{resolver.label(t)}</span>
                  <span className="text-muted text-xs num">{new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                  <Money value={t.amount} colorize className="font-semibold w-28 text-right" />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
