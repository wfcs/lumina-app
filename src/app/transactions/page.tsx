"use client";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { InstLogo } from "@/components/ui/inst-logo";
import { transactions, accounts, catById, monthlyResults } from "@/lib/mock-data";
import { brl, monthLabel, shortDate } from "@/lib/format";
import { Search, MoreHorizontal, ChevronDown, Globe } from "lucide-react";

export default function TransactionsPage() {
  const [month, setMonth] = useState("2026-06");
  const [q, setQ] = useState("");
  const [openPanel, setOpenPanel] = useState(true);

  const rows = useMemo(() => {
    return transactions
      .filter((t) => t.date.startsWith(month))
      .filter((t) => t.description.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [month, q]);

  const income = rows.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expense = rows.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div>
      <PageHeader title="Transações" subtitle="Todas as movimentações das suas contas conectadas" />

      {/* Timeline de meses */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {monthlyResults.map((m) => (
          <button
            key={m.month}
            onClick={() => setMonth(m.month)}
            className={`shrink-0 rounded-lg border px-4 py-2 text-left transition-colors ${m.month === month ? "border-brand bg-brand/5" : "border-[var(--border)]"}`}
          >
            <div className="text-xs text-muted capitalize">{monthLabel(m.month + "-01")}</div>
            <div className={`text-sm font-semibold ${m.net >= 0 ? "text-positive" : "text-danger"}`}>{brl(m.net, { sign: true })}</div>
          </button>
        ))}
      </div>

      {/* Painel categorias colapsável */}
      <Card className="mb-4">
        <button onClick={() => setOpenPanel((v) => !v)} className="flex items-center justify-between w-full">
          <span className="font-semibold text-sm">Gastos por categoria</span>
          <ChevronDown size={18} className={`transition-transform ${openPanel ? "rotate-180" : ""}`} />
        </button>
        {openPanel && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
            {Object.entries(rows.filter((t) => t.amount < 0).reduce((acc, t) => {
              const c = catById(t.categoryId); const k = c?.name ?? "Outros";
              acc[k] = (acc[k] ?? 0) + Math.abs(t.amount); return acc;
            }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]).map(([name, val]) => (
              <div key={name} className="flex justify-between text-sm rounded-lg border border-[var(--border)] px-3 py-2">
                <span className="truncate">{name}</span><Money value={val} className="font-medium" />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Busca */}
      <div className="relative mb-3 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar transações..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm outline-none focus:border-brand" />
      </div>

      {/* Tabela */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted text-xs uppercase border-b border-[var(--border)]">
              <tr>
                <th className="text-left font-medium p-3 w-8"><input type="checkbox" /></th>
                <th className="text-left font-medium p-3">Descrição</th>
                <th className="text-left font-medium p-3 hidden sm:table-cell">Categoria</th>
                <th className="text-left font-medium p-3 hidden sm:table-cell">Data</th>
                <th className="text-right font-medium p-3">Valor</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const acc = accounts.find((a) => a.id === t.accountId);
                const cat = catById(t.categoryId);
                return (
                  <tr key={t.id} className="border-b border-[var(--border)] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <td className="p-3"><input type="checkbox" /></td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <InstLogo id={acc?.institutionId ?? "manual"} size={26} />
                        <div>
                          <div className="font-medium flex items-center gap-1.5">
                            {t.description}
                            {t.installmentTotal && <Badge tone="warn">{t.installmentCurrent}/{t.installmentTotal}</Badge>}
                            {t.fx && <span className="text-muted inline-flex items-center gap-0.5 text-xs"><Globe size={11} /> {t.fx.currency} {t.fx.original}</span>}
                          </div>
                          <div className="text-xs text-muted sm:hidden">{cat?.emoji} {cat?.name} · {shortDate(t.date)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: `${cat?.color}1a`, color: cat?.color }}>{cat?.emoji} {cat?.name}</span>
                    </td>
                    <td className="p-3 hidden sm:table-cell text-muted">{shortDate(t.date)}</td>
                    <td className="p-3 text-right"><Money value={t.amount} className={t.amount > 0 ? "text-positive font-medium" : "font-medium"} /></td>
                    <td className="p-3 text-muted"><MoreHorizontal size={16} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-4 justify-between items-center p-3 border-t border-[var(--border)] text-sm">
          <span className="text-muted">{rows.length} transações</span>
          <div className="flex gap-4">
            <span>Entradas <Money value={income} className="text-positive font-medium" /></span>
            <span>Saídas <Money value={-expense} className="text-danger font-medium" /></span>
            <span>Saldo <Money value={income - expense} colorize className="font-semibold" /></span>
          </div>
        </div>
      </Card>
    </div>
  );
}
