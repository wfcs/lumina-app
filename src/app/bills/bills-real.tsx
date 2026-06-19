"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Money } from "@/components/ui/money";
import type { DbAccount, DbTransaction } from "@/lib/data";
import { categoryPtBr } from "@/lib/categories-ptbr";
import { shortDate } from "@/lib/format";
import { CreditCard } from "lucide-react";

export function BillsReal({ accounts, transactions }: { accounts: DbAccount[]; transactions: DbTransaction[] }) {
  const cards = accounts.filter((a) => (a.type ?? "").toUpperCase() === "CREDIT");
  const total = cards.reduce((s, c) => s + Math.abs(c.balance), 0);
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  if (cards.length === 0) {
    return (
      <div>
        <PageHeader title="Faturas" subtitle="Faturas dos seus cartões de crédito" />
        <Card className="text-center py-14 text-muted"><CreditCard size={32} className="mx-auto mb-2 opacity-60" /><p className="text-sm">Nenhum cartão de crédito conectado.</p></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Faturas" subtitle="Faturas dos seus cartões de crédito (dados reais)" />
      <Card className="mb-5">
        <CardTitle>Total a pagar</CardTitle>
        <Money value={total} className="text-3xl font-bold" />
        <p className="text-xs text-muted mt-1">{cards.length} cartão(ões) de crédito</p>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        {cards.map((c) => {
          const used = Math.abs(c.balance); const limit = c.credit_limit ?? 0;
          const txs = transactions
            .filter((t) => t.account_id === c.id && t.date.startsWith(month) && t.amount < 0)
            .sort((a, b) => b.date.localeCompare(a.date));
          return (
            <Card key={c.id}>
              <div className="flex items-center gap-2 mb-3">
                <span className="grid place-items-center h-9 w-9 rounded-xl bg-[var(--card-2)] text-[var(--accent)]"><CreditCard size={18} /></span>
                <span className="font-semibold text-sm truncate">{c.name ?? "Cartão"}</span>
              </div>
              <div className="flex items-baseline gap-2"><Money value={used} className="text-2xl font-bold" /><span className="text-xs text-muted">fatura atual</span></div>
              {limit > 0 && <><Progress value={used} max={limit} className="mt-2.5" /><p className="text-[11px] text-muted mt-1.5 num">{Math.round((used / limit) * 100)}% de {limit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p></>}
              <div className="mt-4 border-t border-[var(--border)] pt-3">
                <p className="text-[11px] uppercase tracking-wide text-muted mb-2">Lançamentos do mês ({txs.length})</p>
                {txs.length === 0 ? <p className="text-xs text-muted">Sem lançamentos neste mês.</p> : (
                  <div className="space-y-1.5">
                    {txs.slice(0, 5).map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate">{t.description || "—"}</span>
                        <span className="text-muted text-xs hidden sm:block">{categoryPtBr(t.category)}</span>
                        <span className="text-muted text-xs num">{shortDate(t.date)}</span>
                        <Money value={t.amount} className="text-danger font-medium w-24 text-right" />
                      </div>
                    ))}
                    {txs.length > 5 && <p className="text-xs text-muted">+ {txs.length - 5} lançamentos</p>}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
