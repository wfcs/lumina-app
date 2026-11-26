"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import type { DbAccount, DbInvestment, DbDebt } from "@/lib/data";
import { netWorth } from "@/lib/net-worth";
import { accountTypeLabel, loanLabel } from "@/lib/labels";
import { Landmark, CreditCard, Info, PiggyBank, HandCoins } from "lucide-react";

type Row = { id: string; name: string; sub: string; value: number; icon: "bank" | "inv" | "card" | "loan" };
const ICON = { bank: Landmark, inv: PiggyBank, card: CreditCard, loan: HandCoins };
const PALETTE = ["#00D2FF", "#FFD2B3", "#4FCE9A", "#8C84D8", "#7FE6FF", "#F4B860", "#F0839F", "#E8A383", "#5B8DEF", "#C9C4F2"];

function RowList({ rows, total, tone }: { rows: Row[]; total: number; tone: "asset" | "debt" }) {
  return (
    <>
      <div className="flex rounded-full overflow-hidden h-2.5 mb-3 bg-[var(--card-2)]">
        {rows.map((r, i) => <div key={r.id} style={{ width: `${total > 0 ? (Math.abs(r.value) / total) * 100 : 0}%`, background: tone === "debt" ? (i === 0 ? "var(--danger)" : "color-mix(in srgb, var(--danger) 55%, transparent)") : PALETTE[i % PALETTE.length] }} />)}
      </div>
      <div className="space-y-2">
        {rows.map((r, i) => {
          const Icon = ICON[r.icon];
          return (
            <div key={r.id} className="flex items-center gap-3 text-sm">
              <span className="grid place-items-center h-8 w-8 rounded-lg bg-[var(--card-2)] shrink-0" style={{ color: tone === "debt" ? "var(--danger)" : PALETTE[i % PALETTE.length] }}><Icon size={15} /></span>
              <div className="flex-1 min-w-0"><div className="truncate">{r.name}</div><div className="text-xs text-muted">{r.sub}</div></div>
              <Money value={tone === "debt" ? -Math.abs(r.value) : r.value} className={`font-semibold ${tone === "debt" ? "text-danger" : ""}`} />
            </div>
          );
        })}
      </div>
    </>
  );
}

export function PortfolioReal({ accounts, investments, loans }: { accounts: DbAccount[]; investments: DbInvestment[]; loans: DbDebt[] }) {
  const nw = netWorth({ accounts, investments, loans });
  const isCredit = (a: DbAccount) => (a.type ?? "").toUpperCase() === "CREDIT";
  const invTotal = nw.investments;
  const assets: Row[] = [
    ...accounts.filter((a) => !isCredit(a)).map((a): Row => ({ id: a.id, name: a.name ?? "Conta", sub: accountTypeLabel(a.subtype, a.type), value: a.balance, icon: "bank" })),
    ...(investments.some((i) => i.balance > 0) ? [{ id: "inv", name: "Investimentos", sub: `${investments.filter((i) => i.balance > 0).length} aplicações (CDB, Tesouro, fundos)`, value: invTotal, icon: "inv" as const }] : []),
  ].sort((a, b) => b.value - a.value);
  const debts: Row[] = [
    ...loans.filter((l) => l.outstanding_balance > 0).map((l): Row => ({ id: l.id, name: loanLabel(l.name), sub: `Empréstimo · ${l.installments_paid ?? 0} de ${l.installments_total ?? "?"} parcelas pagas`, value: l.outstanding_balance, icon: "loan" })),
    ...accounts.filter(isCredit).map((a): Row => ({ id: a.id, name: a.name ?? "Cartão", sub: "Cartão de crédito · limite usado", value: Math.abs(a.balance), icon: "card" })),
  ].sort((a, b) => b.value - a.value);

  return (
    <div>
      <PageHeader title="Patrimônio" subtitle="O que você tem menos o que você deve (dados do Open Finance)" />
      <Card className="mb-5">
        <CardTitle>Patrimônio líquido</CardTitle>
        <Money value={nw.net} countUp className={`text-3xl font-bold ${nw.net < 0 ? "text-danger" : ""}`} />
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span className="text-muted">Ativos <Money value={nw.assets} className="text-[var(--mint)] font-semibold" /></span>
          <span className="text-muted">Dívidas <Money value={-nw.debts} className="text-danger font-semibold" /></span>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardTitle>Ativos ({assets.length})</CardTitle>
          {assets.length === 0 ? <p className="text-sm text-muted">Nenhum ativo encontrado.</p> : <RowList rows={assets} total={nw.assets} tone="asset" />}
        </Card>
        <Card>
          <CardTitle>Dívidas ({debts.length})</CardTitle>
          {debts.length === 0 ? <p className="text-sm text-muted">Nenhuma dívida encontrada.</p> : <RowList rows={debts} total={nw.debts} tone="debt" />}
          <div className="flex items-start gap-2 text-xs text-muted mt-4"><Info size={13} className="mt-0.5 shrink-0" /> Empréstimos pelo saldo devedor informado pelo banco; cartões pelo limite usado (inclui a fatura aberta). Detalhe e ordem de pagamento na tela Dívidas.</div>
        </Card>
      </div>
    </div>
  );
}
