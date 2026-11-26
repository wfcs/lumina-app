"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import type { DbTransaction, UserCategory } from "@/lib/data";
import { makeResolver } from "@/lib/cat-resolve";
import { brl } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

const tt = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text)", fontSize: 12 };
const PALETTE = ["#00D2FF", "#FFD2B3", "#4FCE9A", "#8C84D8", "#7FE6FF", "#F4B860", "#F0839F", "#E8A383", "#5B8DEF", "#C9C4F2"];

export function CashflowReal({ transactions, categories }: { transactions: DbTransaction[]; categories: UserCategory[] }) {
  const resolver = makeResolver(categories);
  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const t of transactions) {
    const m = t.date.slice(0, 7);
    const cur = byMonth.get(m) ?? { income: 0, expense: 0 };
    if (t.amount >= 0) cur.income += t.amount; else cur.expense += Math.abs(t.amount);
    byMonth.set(m, cur);
  }
  // Período único para tudo na tela: os 6 meses até o mês atual (parcelas futuras ficam de fora).
  const thisMonth = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date()).slice(0, 7);
  const keys = Array.from(byMonth.keys()).filter((m) => m <= thisMonth).sort().slice(-6);
  const inPeriod = transactions.filter((t) => keys.includes(t.date.slice(0, 7)));
  const months = keys.map((m) => {
    const v = byMonth.get(m)!;
    return { label: m.slice(5) + "/" + m.slice(2, 4), net: Math.round(v.income - v.expense), income: Math.round(v.income), expense: Math.round(v.expense) };
  });
  const totalNet = months.reduce((s, m) => s + m.net, 0);
  const totalIncome = inPeriod.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpense = inPeriod.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  const group = (sign: 1 | -1) => {
    const m = new Map<string, number>();
    inPeriod.filter((t) => Math.sign(t.amount) === sign).forEach((t) => {
      const k = resolver.parentLabel(t);
      m.set(k, (m.get(k) ?? 0) + Math.abs(t.amount));
    });
    return Array.from(m.entries()).sort((x, y) => y[1] - x[1]).map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] }));
  };
  const byCat = group(-1);
  const byIncome = group(1);
  // Mosaico: 8 maiores + "Outros", para não virar arco-íris.
  const top = byCat.slice(0, 8);
  const rest = byCat.slice(8).reduce((s, c) => s + c.value, 0);
  const tiles = rest > 0 ? [...top, { name: "Outros", value: rest, color: "#A9A5CF" }] : top;
  const period = months.length ? `${months[0].label} a ${months[months.length - 1].label}` : "";

  return (
    <div>
      <PageHeader title="Fluxo de Caixa" subtitle={`Entradas, saídas e para onde foi o dinheiro · ${period}`} />

      <Card className="mb-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div><h3 className="text-sm text-muted">Resultado do período (entradas − saídas)</h3><Money value={totalNet} colorize className="text-3xl font-bold" /></div>
          <Badge tone={totalNet >= 0 ? "positive" : "danger"}>{totalNet >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {months.length} meses</Badge>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={months} barGap={4}>
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={false} tickLine={false} />
              <YAxis width={64} tick={{ fontSize: 11, fill: "var(--muted)" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => brl(v).replace(",00", "")} />
              <Tooltip contentStyle={tt} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(v: number, n: string) => [brl(v), n === "income" ? "Entradas" : "Saídas"]} />
              <Bar dataKey="income" fill="var(--mint)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="var(--danger)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 text-xs text-muted mt-2">
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[var(--mint)]" />Entradas</span>
          <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-[var(--danger)]" />Saídas</span>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        <Card>
          <CardTitle action={<Money value={totalIncome} className="text-positive font-bold" />}>Receitas</CardTitle>
          <div className="space-y-2 mt-1">
            {byIncome.length === 0 && <p className="text-sm text-muted">Nenhuma entrada no período.</p>}
            {byIncome.slice(0, 5).map((c) => (
              <div key={c.name} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--mint)]" />
                <span className="flex-1 truncate">{c.name}</span>
                <Money value={c.value} className="font-medium" />
              </div>
            ))}
          </div>
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
            {tiles.map((c) => {
              const size = Math.max(90, (c.value / byCat[0].value) * 220);
              return (
                <div key={c.name} className="rounded-lg p-3 text-[#1C1747] flex flex-col justify-between" style={{ background: c.color, width: size, minHeight: 92 }}>
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
