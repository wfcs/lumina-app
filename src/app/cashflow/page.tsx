"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { monthlyResults, spendByParentCategory, totalIncome, totalExpense } from "@/lib/mock-data";
import { brl } from "@/lib/format";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

const periods = ["1 mês", "3 meses", "6 meses", "12 meses"];

export default function CashflowPage() {
  const [period, setPeriod] = useState("6 meses");
  const byCat = spendByParentCategory();
  const income = totalIncome();
  const expense = totalExpense();
  const totalNet = monthlyResults.reduce((s, m) => s + m.net, 0);

  return (
    <div>
      <PageHeader
        title="Fluxo de Caixa"
        subtitle="Para onde seu dinheiro está indo"
        action={
          <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5">
            {periods.map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-md text-xs font-medium ${p === period ? "bg-brand text-white" : "text-muted"}`}>{p}</button>
            ))}
          </div>
        }
      />

      <Card className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm text-muted">Resultado líquido do período</h3>
            <Money value={totalNet} colorize className="text-3xl font-bold" />
          </div>
          <Badge tone="positive"><TrendingUp size={12} /> +24% vs. período anterior</Badge>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyResults.map((m) => ({ ...m, label: m.month.slice(5) }))}>
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => brl(v)} />
              <Bar dataKey="net" radius={[4, 4, 0, 0]}>
                {monthlyResults.map((m) => <Cell key={m.month} fill={m.net >= 0 ? "#16A34A" : "#DC2626"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <Card>
          <CardTitle action={<Money value={income} className="text-positive font-bold" />}>Receitas</CardTitle>
          <div className="flex items-center gap-2 text-sm text-positive mb-3"><TrendingUp size={14} /> +8,2% vs. mês anterior</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>💰 Salário</span><Money value={12500} className="font-medium" /></div>
            <div className="flex justify-between"><span>💻 Freelance</span><Money value={3650} className="font-medium" /></div>
          </div>
        </Card>
        <Card>
          <CardTitle action={<Money value={expense} className="text-danger font-bold" />}>Gastos</CardTitle>
          <div className="flex items-center gap-2 text-sm text-danger mb-3"><TrendingDown size={14} /> +12% vs. mês anterior</div>
          <div className="space-y-2">
            {byCat.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                <span className="flex-1 truncate">{c.emoji} {c.name}</span>
                <Money value={c.value} className="font-medium" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* "Para onde foi" — treemap simplificado */}
      <Card>
        <CardTitle>Para onde foi o dinheiro</CardTitle>
        <div className="flex flex-wrap gap-2">
          {byCat.map((c) => {
            const size = Math.max(90, (c.value / byCat[0].value) * 220);
            return (
              <div key={c.id} className="rounded-lg p-3 text-white flex flex-col justify-between" style={{ background: c.color, width: size, minHeight: 92 }}>
                <span className="text-xs font-medium opacity-90">{c.emoji} {c.name}</span>
                <Money value={c.value} className="font-bold" />
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted mt-3">Receita total de {brl(income)} distribuída entre {byCat.length} grupos de despesa.</p>
      </Card>
    </div>
  );
}
