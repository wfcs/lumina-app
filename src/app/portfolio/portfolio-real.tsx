"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Money } from "@/components/ui/money";
import type { DbAccount } from "@/lib/data";
import { Landmark, CreditCard, Info } from "lucide-react";

export function PortfolioReal({ accounts }: { accounts: DbAccount[] }) {
  const isCredit = (a: DbAccount) => (a.type ?? "").toUpperCase() === "CREDIT";
  const ativos = accounts.filter((a) => !isCredit(a));
  const dividas = accounts.filter(isCredit);
  const totalAtivos = ativos.reduce((s, a) => s + a.balance, 0);
  const totalDividas = dividas.reduce((s, a) => s + Math.abs(a.balance), 0);
  const net = totalAtivos - totalDividas;
  const PALETTE = ["#7C3AED", "#D7B8F3", "#4FCE9A", "#B8B8F3", "#A855F7", "#37B588"];

  return (
    <div>
      <PageHeader title="Patrimônio" subtitle="Ativos − dívidas (dados reais)" />
      <Card className="mb-5">
        <CardTitle>Patrimônio líquido</CardTitle>
        <Money value={net} className="text-3xl font-bold" />
        <div className="mt-3 flex gap-6 text-sm">
          <span className="text-muted">Ativos <Money value={totalAtivos} className="text-[var(--mint)] font-semibold" /></span>
          <span className="text-muted">Dívidas <Money value={-totalDividas} className="text-danger font-semibold" /></span>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardTitle>Ativos ({ativos.length})</CardTitle>
          {ativos.length === 0 ? <p className="text-sm text-muted">Nenhuma conta de ativo.</p> : (
            <>
              <div className="flex rounded-full overflow-hidden h-2.5 mb-3">
                {ativos.map((a, i) => <div key={a.id} style={{ width: `${totalAtivos > 0 ? (a.balance / totalAtivos) * 100 : 0}%`, background: PALETTE[i % PALETTE.length] }} />)}
              </div>
              <div className="space-y-2">
                {ativos.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-3 text-sm">
                    <span className="grid place-items-center h-8 w-8 rounded-lg bg-[var(--card-2)]" style={{ color: PALETTE[i % PALETTE.length] }}><Landmark size={15} /></span>
                    <div className="flex-1 min-w-0"><div className="truncate">{a.name ?? "Conta"}</div><div className="text-xs text-muted">{a.subtype ?? a.type ?? ""}</div></div>
                    <Money value={a.balance} className="font-semibold" />
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card>
          <CardTitle>Dívidas ({dividas.length})</CardTitle>
          {dividas.length === 0 ? <p className="text-sm text-muted">Nenhuma dívida (cartões).</p> : (
            <div className="space-y-2">
              {dividas.map((d) => (
                <div key={d.id} className="flex items-center gap-3 text-sm">
                  <span className="grid place-items-center h-8 w-8 rounded-lg bg-[var(--card-2)] text-danger"><CreditCard size={15} /></span>
                  <span className="flex-1 truncate">{d.name ?? "Cartão"}</span>
                  <Money value={-Math.abs(d.balance)} className="text-danger font-semibold" />
                </div>
              ))}
            </div>
          )}
          <div className="flex items-start gap-2 text-[11px] text-muted mt-4"><Info size={13} className="mt-0.5 shrink-0" /> Investimentos e empréstimos detalhados chegam quando a sincronização desses produtos estiver ligada.</div>
        </Card>
      </div>
    </div>
  );
}
