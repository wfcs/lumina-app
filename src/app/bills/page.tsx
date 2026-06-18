"use client";
import { ExampleBanner } from "@/components/ui/example-banner";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { InstLogo } from "@/components/ui/inst-logo";
import { bills } from "@/lib/mock-data";
import { brl, shortDate } from "@/lib/format";
import { Info, ArrowRight } from "lucide-react";

export default function BillsPage() {
  const total = bills.reduce((s, b) => s + b.total, 0);
  const installments = bills.reduce((s, b) => s + b.installments, 0);
  const recurringTot = bills.reduce((s, b) => s + b.recurring, 0);
  const oneoff = bills.reduce((s, b) => s + b.oneoff, 0);
  const credits = bills.reduce((s, b) => s + b.credits, 0);
  const pending = bills.reduce((s, b) => s + b.pendingForecast, 0);
  const today = new Date("2026-06-16");

  return (
    <div>
      <ExampleBanner />
      <PageHeader title="Faturas" subtitle="Total consolidado a pagar nos seus cartões" />

      <Card className="mb-5">
        <div className="flex items-baseline gap-2 mb-4">
          <Money value={total} className="text-3xl font-bold" />
          <span className="text-muted text-sm">a pagar</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          {[["Parcelas", installments], ["Recorrentes", recurringTot], ["Compras avulsas", oneoff], ["Créditos/devoluções", credits]].map(([l, v]) => (
            <div key={l as string} className="rounded-lg border border-[var(--border)] p-3">
              <div className="text-xs text-muted">{l}</div>
              <Money value={v as number} colorize={(v as number) < 0} className="font-semibold" />
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 mt-4 text-xs text-muted bg-brand/5 rounded-lg p-3">
          <Info size={14} className="text-brand mt-0.5 shrink-0" />
          <span>A fatura já inclui {brl(pending)} em parcelas previstas ainda não lançadas. O valor final pode mudar quando a fatura fechar.</span>
        </div>
      </Card>

      <Card className="mb-5">
        <CardTitle>Ciclos de faturamento</CardTitle>
        <div className="space-y-3">
          {bills.map((b) => {
            const start = new Date(b.cycleStart); const close = new Date(b.closingDate);
            const span = 42; // 6 semanas
            const base = new Date("2026-05-25");
            const left = Math.max(0, ((start.getTime() - base.getTime()) / 86400000 / span) * 100);
            const width = Math.min(100 - left, ((close.getTime() - start.getTime()) / 86400000 / span) * 100);
            const todayPct = ((today.getTime() - base.getTime()) / 86400000 / span) * 100;
            return (
              <div key={b.accountId}>
                <div className="flex items-center gap-2 text-xs mb-1"><InstLogo id={b.institutionId} size={20} /><span className="font-medium">{b.cardName}</span></div>
                <div className="relative h-8 rounded-lg bg-black/5 dark:bg-white/5">
                  <div className="absolute h-full rounded-lg bg-brand/80 grid place-items-center text-white text-xs font-medium" style={{ left: `${left}%`, width: `${width}%` }}>{brl(b.total)}</div>
                  <div className="absolute top-0 h-full w-0.5 bg-danger" style={{ left: `${todayPct}%` }} title="Hoje" />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted mt-2">Linha vermelha = hoje (16/06). Barras = ciclo atual aberto de cada cartão.</p>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bills.map((b) => {
          const days = Math.round((new Date(b.dueDate).getTime() - today.getTime()) / 86400000);
          return (
            <Card key={b.accountId}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><InstLogo id={b.institutionId} /><span className="font-medium text-sm">{b.cardName}</span></div>
                <Badge tone="brand">Ciclo atual</Badge>
              </div>
              <Money value={b.total} className="text-2xl font-bold" />
              <div className="text-xs text-muted mt-1">Vence {shortDate(b.dueDate)} · {days} dias</div>
              <div className="text-xs text-muted mt-2">{brl(b.installments)} parcelas · {brl(b.recurring)} recorr. · {brl(b.oneoff)} compras</div>
              {b.pendingForecast > 0 && <div className="text-xs text-warn mt-2">+ {brl(b.pendingForecast)} previstos pendentes</div>}
              <a className="text-brand text-xs font-medium flex items-center gap-1 mt-3" href="/transactions">Ver transações <ArrowRight size={12} /></a>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
