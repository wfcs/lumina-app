"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Money } from "@/components/ui/money";
import type { DbTransaction } from "@/lib/data";
import { categoryPtBr } from "@/lib/categories-ptbr";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { brl } from "@/lib/format";

const tt = { background: "#1C1C22", border: "1px solid #2C2C34", borderRadius: 12, color: "#EAEEF6", fontSize: 12 };
const PALETTE = ["#8332AC", "#E086D3", "#B8EBD0", "#F2D1C9", "#9D4EDD", "#5FBF96", "#F4B860", "#FF6B7A", "#0EA5E9", "#EAB308"];

export function CategoriesReal({ transactions }: { transactions: DbTransaction[] }) {
  const months = Array.from(new Set(transactions.map((t) => t.date.slice(0, 7)))).sort();
  const month = months[months.length - 1] ?? "";
  const monthLabel = month ? new Date(month + "-01T00:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : "";
  const tx = transactions.filter((t) => t.date.startsWith(month) && t.amount < 0);

  const catMap = new Map<string, number>();
  tx.forEach((t) => { const k = categoryPtBr(t.category); catMap.set(k, (catMap.get(k) ?? 0) + Math.abs(t.amount)); });
  const cats = Array.from(catMap.entries()).map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] })).sort((a, b) => b.value - a.value);
  const total = cats.reduce((s, c) => s + c.value, 0);
  const max = cats[0]?.value ?? 1;

  return (
    <div>
      <PageHeader title="Categorias" subtitle="Seus gastos por categoria (dados reais)" />
      <div className="grid lg:grid-cols-3 gap-5">
        <Card>
          <CardTitle>Total em {monthLabel}</CardTitle>
          <div className="relative h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cats} dataKey="value" innerRadius={55} outerRadius={75} paddingAngle={2} stroke="none">
                  {cats.map((c) => <Cell key={c.name} fill={c.color} />)}
                </Pie>
                <Tooltip contentStyle={tt} formatter={(v: number) => brl(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 grid place-items-center text-center pointer-events-none"><Money value={total} className="font-bold" /></div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle>Distribuição</CardTitle>
          {cats.length === 0 ? <p className="text-sm text-muted">Sem gastos categorizados neste mês.</p> : (
            <div className="space-y-3">
              {cats.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1"><span className="truncate">{c.name}</span><Money value={c.value} className="font-semibold" /></div>
                    <Progress value={c.value} max={max} />
                  </div>
                  <span className="text-xs text-muted num w-10 text-right">{Math.round((c.value / total) * 100)}%</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
