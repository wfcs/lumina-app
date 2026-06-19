"use client";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import type { DbTransaction } from "@/lib/data";
import { categoryPtBr } from "@/lib/categories-ptbr";
import { Repeat, TrendingDown, TrendingUp } from "lucide-react";

function normalize(desc: string | null): string {
  return (desc ?? "")
    .toLowerCase()
    .replace(/\d+/g, " ")
    .replace(/[^a-zà-ú\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ").slice(0, 3).join(" ");
}

interface Group { key: string; name: string; avg: number; count: number; months: number; category: string; lastDate: string; }

function topOf(counter: Map<string, number>, fallback: string): string {
  let best = fallback; let max = -1;
  Array.from(counter.entries()).forEach(([k, n]) => { if (n > max) { max = n; best = k; } });
  return best;
}

function detect(txs: DbTransaction[], sign: "expense" | "income"): Group[] {
  const map = new Map<string, DbTransaction[]>();
  for (const t of txs) {
    const isExp = t.amount < 0;
    if (sign === "expense" ? !isExp : isExp) continue;
    const key = normalize(t.description);
    if (key.length < 3) continue;
    const arr = map.get(key);
    if (arr) arr.push(t); else map.set(key, [t]);
  }

  const groups: Group[] = [];
  Array.from(map.entries()).forEach(([key, items]) => {
    const months = new Set(items.map((i) => i.date.slice(0, 7)));
    if (months.size < 2) return; // recorrente = aparece em ≥2 meses
    const total = items.reduce((s, i) => s + Math.abs(i.amount), 0);
    const catCount = new Map<string, number>();
    const nameCount = new Map<string, number>();
    items.forEach((i) => {
      const c = i.category ?? "";
      catCount.set(c, (catCount.get(c) ?? 0) + 1);
      const d = (i.description ?? "").trim();
      nameCount.set(d, (nameCount.get(d) ?? 0) + 1);
    });
    groups.push({
      key,
      name: topOf(nameCount, key),
      avg: total / items.length,
      count: items.length,
      months: months.size,
      category: categoryPtBr(topOf(catCount, "") || null),
      lastDate: items.map((i) => i.date).sort().slice(-1)[0] ?? "",
    });
  });
  return groups.sort((a, b) => b.avg - a.avg);
}

export function RecurringReal({ transactions }: { transactions: DbTransaction[] }) {
  const [tab, setTab] = useState<"expense" | "income">("expense");
  const expense = useMemo(() => detect(transactions, "expense"), [transactions]);
  const income = useMemo(() => detect(transactions, "income"), [transactions]);
  const list = tab === "expense" ? expense : income;
  const monthlyExpense = expense.reduce((s, g) => s + g.avg, 0);
  const monthlyIncome = income.reduce((s, g) => s + g.avg, 0);

  return (
    <div>
      <PageHeader title="Recorrentes" subtitle="Detectadas automaticamente nas suas transações reais" />

      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <Card><CardTitle>Despesas recorrentes</CardTitle><div className="flex items-center gap-2"><TrendingDown size={18} className="text-danger" /><Money value={-monthlyExpense} className="text-2xl font-bold" /></div><p className="text-xs text-muted mt-1">{expense.length} detectadas · estimativa/mês</p></Card>
        <Card><CardTitle>Receitas recorrentes</CardTitle><div className="flex items-center gap-2"><TrendingUp size={18} className="text-[var(--mint)]" /><Money value={monthlyIncome} className="text-2xl font-bold" /></div><p className="text-xs text-muted mt-1">{income.length} detectadas · estimativa/mês</p></Card>
        <Card><CardTitle>Sobra estimada</CardTitle><Money value={monthlyIncome - monthlyExpense} colorize className="text-2xl font-bold" /><p className="text-xs text-muted mt-1">receita − despesa recorrente</p></Card>
      </div>

      <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5 mb-4">
        <button onClick={() => setTab("expense")} className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === "expense" ? "bg-brand text-white" : "text-muted"}`}>Despesas ({expense.length})</button>
        <button onClick={() => setTab("income")} className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === "income" ? "bg-brand text-white" : "text-muted"}`}>Receitas ({income.length})</button>
      </div>

      <Card className="p-0 overflow-hidden">
        {list.length === 0 ? (
          <div className="p-8 text-center text-muted">
            <Repeat size={28} className="mx-auto mb-2 opacity-60" />
            <p className="text-sm">Nenhuma recorrência detectada ainda. É preciso ter ao menos 2 meses de extrato para identificar padrões.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-muted text-xs uppercase border-b border-[var(--border)]">
              <tr><th className="text-left p-3">Descrição</th><th className="text-left p-3 hidden sm:table-cell">Categoria</th><th className="text-left p-3">Frequência</th><th className="text-right p-3">Valor médio</th></tr>
            </thead>
            <tbody>
              {list.map((g) => (
                <tr key={g.key} className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.02]">
                  <td className="p-3 font-medium">{g.name}</td>
                  <td className="p-3 hidden sm:table-cell"><span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-white/[0.05] text-muted">{g.category}</span></td>
                  <td className="p-3"><Badge tone="brand">{g.months} meses · {g.count}x</Badge></td>
                  <td className="p-3 text-right"><Money value={tab === "expense" ? -g.avg : g.avg} colorize className="font-semibold" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <p className="text-xs text-muted mt-3">Detecção heurística: agrupa lançamentos com descrição parecida que se repetem em meses diferentes. Quanto mais histórico, mais precisa.</p>
    </div>
  );
}
