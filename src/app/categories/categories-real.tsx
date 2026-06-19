"use client";
import { useMemo, useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import type { DbTransaction, UserCategory } from "@/lib/data";
import { makeResolver } from "@/lib/cat-resolve";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { brl } from "@/lib/format";

const tt = { background: "#1C1C22", border: "1px solid #2C2C34", borderRadius: 12, color: "#EAEEF6", fontSize: 12 };
const PALETTE = ["#8332AC", "#E086D3", "#B8EBD0", "#F2D1C9", "#9D4EDD", "#5FBF96", "#F4B860", "#FF6B7A", "#0EA5E9", "#EAB308", "#22C55E", "#A855F7"];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const selectCls = "h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--card-2)] text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]";
const pad = (n: number) => String(n).padStart(2, "0");

function group(items: { key: string; value: number }[]) {
  const m = new Map<string, number>();
  items.forEach((i) => m.set(i.key, (m.get(i.key) ?? 0) + i.value));
  return Array.from(m.entries())
    .map(([name, value], i) => ({ name, value, color: PALETTE[i % PALETTE.length] }))
    .sort((a, b) => b.value - a.value);
}

export function CategoriesReal({ transactions, categories }: { transactions: DbTransaction[]; categories: UserCategory[] }) {
  const now = new Date();
  const resolver = useMemo(() => makeResolver(categories), [categories]);
  const years = useMemo(() => Array.from(new Set(transactions.map((t) => t.date.slice(0, 4)))).sort((a, b) => b.localeCompare(a)), [transactions]);
  const curYear = String(now.getFullYear());
  const [year, setYear] = useState(years.includes(curYear) ? curYear : (years[0] ?? curYear));
  const [month, setMonth] = useState(pad(now.getMonth() + 1));

  const selected = `${year}-${month}`;
  const monthLabel = `${MESES[Number(month) - 1]} de ${year}`;
  const monthExp = useMemo(() => transactions.filter((t) => t.date.startsWith(selected) && t.amount < 0), [transactions, selected]);

  // Distribuição por categoria-pai
  const dist = useMemo(() => group(monthExp.map((t) => ({ key: resolver.parentLabel(t), value: Math.abs(t.amount) }))), [monthExp, resolver]);
  // Subcategorias (atribuídas) — exclui não classificadas
  const subs = useMemo(() => group(monthExp.filter((t) => resolver.subLabel(t)).map((t) => ({ key: resolver.subLabel(t)!, value: Math.abs(t.amount) }))), [monthExp, resolver]);

  const total = dist.reduce((s, c) => s + c.value, 0);
  const max = dist[0]?.value ?? 1;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={year} onChange={(e) => setYear(e.target.value)} className={selectCls} aria-label="Ano">
          {years.length === 0 && <option value={year}>{year}</option>}
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={month} onChange={(e) => setMonth(e.target.value)} className={selectCls} aria-label="Mês">
          {MESES.map((mm, i) => <option key={mm} value={pad(i + 1)}>{mm}</option>)}
        </select>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card>
          <CardTitle>Total · {monthLabel}</CardTitle>
          {total === 0 ? (
            <p className="text-sm text-muted py-12 text-center">Sem gastos neste mês.</p>
          ) : (
            <>
              <div className="relative h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={dist} dataKey="value" innerRadius={55} outerRadius={75} paddingAngle={2} stroke="none">
                      {dist.map((c) => <Cell key={c.name} fill={c.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tt} formatter={(v: number) => brl(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 grid place-items-center text-center pointer-events-none"><Money value={total} className="font-bold" /></div>
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--border)]">
                <p className="text-[11px] uppercase tracking-wide text-muted mb-2">Subcategorias · top 15</p>
                {subs.length === 0 ? (
                  <p className="text-xs text-muted">Classifique transações em subcategorias para vê-las aqui.</p>
                ) : (
                  <div className="space-y-1.5">
                    {subs.slice(0, 15).map((c, i) => (
                      <div key={c.name} className="flex items-center gap-2 text-sm">
                        <span className="text-[11px] text-muted num w-4 text-right shrink-0">{i + 1}</span>
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: c.color }} />
                        <span className="flex-1 truncate">{c.name}</span>
                        <Money value={c.value} className="font-medium" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle>Distribuição por categoria</CardTitle>
          {dist.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">Sem gastos em {monthLabel}.</p>
          ) : (
            <div className="space-y-3">
              {dist.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm mb-1"><span className="truncate">{c.name}</span><Money value={c.value} className="font-semibold" /></div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(c.value / max) * 100}%`, background: c.color }} /></div>
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
