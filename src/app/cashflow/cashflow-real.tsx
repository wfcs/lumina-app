"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import type { DbTransaction } from "@/lib/data";
import { categoryPtBr } from "@/lib/categories-ptbr";
import { brl } from "@/lib/format";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

const tt = { background: "#1C1C22", border: "1px solid #2C2C34", borderRadius: 12, color: "#EAEEF6", fontSize: 12 };
const PALETTE = ["#8332AC", "#E086D3", "#B8EBD0", "#F2D1C9", "#9D4EDD", "#5FBF96", "#F4B860", "#FF6B7A"];

export function CashflowReal({ transactions }: { transactions: DbTransaction[] }) {
  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const t of transactions) {
    const m = t.date.slice(0, 7);
    const cur = byMonth.get(m) ?? { income: 0, expense: 0 };
    if (t.amount >= 0) cur.income += t.amount; else cur.expense += Math.abs(t.amount);
    byMonth.set(m, cur);
  }
  const months = Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-6)
    .map(([m, v]) => ({ label: m.slice(5) + "/" + m.slice(2, 4), net: Math.round(v.income - v.expense), income: v.income, expense: v.expense }));
  const totalNet = months.reduce((s, m) => s + m.net, 0);
  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const catMap = new Map<string, number>();
  transactions.filter((t) => t.amount < 0).forEach((t) => {
    const k = categoryPtBr(t.category);
    catMap.set(k, (catMap.get(k) ?? 0) + Math.abs(t.amount));
  });
  const byCat = Array.from(catMap.entries()).map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] })).sort((a, b) => b.value - a.value);

  return (
    <div>
      <PageHeader title="Fluxo de Caixa" subtitle="Para onde seu dinheiro está indo (dados reais)" />

      <Card className="mb-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div><h3 className="text-sm text-muted">Resultado líquido (últimos meses)</h3><Money value={totalNet} colorize className="text-3xl font-bold" /></div>
          <Badge tone={totalNet >= 0 ? "positive" : "danger"}>{totalNet >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {months.length} meses</Badge>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months}>
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tt} formatter={(v: number) => brl(v)} />
              <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                {months.map((m, i) => <Cell key={i} fill={m.net >= 0 ? "#B8EBD0" : "#FF6B7A"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <Card>
          <CardTitle action={<Money value={totalIncome} className="text-positive font-bold" />}>Receitas</CardTitle>
          <p className="text-sm text-muted">Total recebido no período</p>
        </Card>
        <Card>
          <CardTitle action={<Money value={totalExpense} className="text-danger font-bold" />}>Gastos</CardTitle>
          <div className="space-y-2 mt-1">
            {byCat.slice(0, 5).map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                <span className="flex-1 truncate">{c.name}</span>
                <Money value={c.value} className="font-medium" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Para onde foi o dinheiro</CardTitle>
        {byCat.length === 0 ? <p className="text-sm text-muted">Sem gastos no período.</p> : (
          <div className="flex flex-wrap gap-2">
            {byCat.map((c) => {
              const size = Math.max(90, (c.value / byCat[0].value) * 220);
              return (
                <div key={c.name} className="rounded-lg p-3 text-white flex flex-col justify-between" style={{ background: c.color, width: size, minHeight: 92 }}>
                  <span className="text-xs font-medium opacity-90 truncate">{c.name}</span>
                  <Money value={c.value} className="font-bold" />
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
