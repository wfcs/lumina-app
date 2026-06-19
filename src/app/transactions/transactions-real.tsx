"use client";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { shortDate } from "@/lib/format";
import { categoryPtBr } from "@/lib/categories-ptbr";
import type { DbTransaction } from "@/lib/data";
import { Search } from "lucide-react";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const selectCls = "h-9 px-3 rounded-xl border border-[var(--border)] bg-[var(--card-2)] text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]";

export function TransactionsReal({ transactions }: { transactions: DbTransaction[] }) {
  const years = useMemo(
    () => Array.from(new Set(transactions.map((t) => t.date.slice(0, 4)))).sort((a, b) => b.localeCompare(a)),
    [transactions]
  );
  const categories = useMemo(
    () => Array.from(new Set(transactions.map((t) => categoryPtBr(t.category)))).sort((a, b) => a.localeCompare(b)),
    [transactions]
  );

  const [year, setYear] = useState(years[0] ?? String(new Date().getFullYear()));
  const [month, setMonth] = useState("all");
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");

  const rows = useMemo(
    () =>
      transactions
        .filter((t) => t.date.slice(0, 4) === year)
        .filter((t) => month === "all" || t.date.slice(5, 7) === month)
        .filter((t) => cat === "all" || categoryPtBr(t.category) === cat)
        .filter((t) => (t.description ?? "").toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, year, month, cat, q]
  );

  const income = rows.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense = rows.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div>
      <PageHeader title="Transações" subtitle="Movimentações reais coletadas via Open Finance / importação" />

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <select value={year} onChange={(e) => setYear(e.target.value)} className={selectCls} aria-label="Ano">
          {years.length === 0 && <option value={year}>{year}</option>}
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        <select value={month} onChange={(e) => setMonth(e.target.value)} className={selectCls} aria-label="Mês">
          <option value="all">Todos os meses</option>
          {MESES.map((m, i) => <option key={m} value={String(i + 1).padStart(2, "0")}>{m}</option>)}
        </select>

        <select value={cat} onChange={(e) => setCat(e.target.value)} className={selectCls} aria-label="Categoria">
          <option value="all">Todas as categorias</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-3 h-9 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm outline-none focus:border-[var(--accent)]" />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted text-xs uppercase border-b border-[var(--border)]">
              <tr>
                <th className="text-left font-medium p-3">Descrição</th>
                <th className="text-left font-medium p-3 hidden sm:table-cell">Categoria</th>
                <th className="text-left font-medium p-3 hidden sm:table-cell">Data</th>
                <th className="text-right font-medium p-3">Valor</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-muted">Nenhuma transação para este filtro.</td></tr>
              )}
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.02]">
                  <td className="p-3">
                    <div className="font-medium">{t.description || "—"}</div>
                    <div className="text-xs text-muted sm:hidden">{categoryPtBr(t.category)} · {shortDate(t.date)}</div>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/[0.05] text-muted">{categoryPtBr(t.category)}</span>
                  </td>
                  <td className="p-3 hidden sm:table-cell text-muted">{shortDate(t.date)}</td>
                  <td className="p-3 text-right"><Money value={t.amount} colorize className="font-semibold" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-4 justify-between items-center p-3 border-t border-[var(--border)] text-sm">
          <span className="text-muted">{rows.length} transações</span>
          <div className="flex gap-4">
            <span>Entradas <Money value={income} className="text-positive font-semibold" /></span>
            <span>Saídas <Money value={-expense} className="text-danger font-semibold" /></span>
            <span>Saldo <Money value={income - expense} colorize className="font-semibold" /></span>
          </div>
        </div>
      </Card>
    </div>
  );
}
