"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Money } from "@/components/ui/money";
import { InstLogo } from "@/components/ui/inst-logo";
import { accounts, institutions } from "@/lib/mock-data";
import { brl } from "@/lib/format";
import { Plus, AlertTriangle, ChevronDown } from "lucide-react";

const statusMap = { updated: { tone: "positive", label: "Atualizado" }, unstable: { tone: "warn", label: "Instável" }, expired: { tone: "danger", label: "Expirado" } } as const;

export default function AccountsPage() {
  const [showBanner, setShowBanner] = useState(true);
  const cards = accounts.filter((a) => a.type === "credit");
  const banks = accounts.filter((a) => a.type === "checking" || a.type === "savings");
  const totalDebt = cards.reduce((s, c) => s + (c.creditUsed ?? 0), 0);
  const totalBalance = banks.reduce((s, b) => s + b.balance, 0);
  const unstable = institutions.filter((i) => i.status !== "updated");

  return (
    <div>
      <PageHeader title="Contas" subtitle="Tudo que está conectado via Open Finance" action={<button className="inline-flex items-center gap-1.5 bg-brand text-white px-3 py-2 rounded-lg text-sm font-medium"><Plus size={16} /> Adicionar conta</button>} />

      {showBanner && unstable.length > 0 && (
        <div className="rounded-xl border border-warn/40 bg-warn/5 p-4 mb-5">
          <button onClick={() => setShowBanner(false)} className="flex items-center gap-2 w-full text-left">
            <AlertTriangle size={18} className="text-warn" />
            <span className="font-medium text-sm flex-1">{unstable.length} instituições com instabilidade ou conexão expirada</span>
            <ChevronDown size={16} className="text-muted" />
          </button>
          <div className="flex flex-wrap gap-2 mt-3">
            {unstable.map((i) => <Badge key={i.id} tone={statusMap[i.status].tone}>{i.emoji} {i.name} — {statusMap[i.status].label}</Badge>)}
          </div>
        </div>
      )}

      <Card className="mb-5">
        <CardTitle action={<Money value={-totalDebt} className="text-danger font-bold" />}>Cartões de Crédito ({cards.length})</CardTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cards.map((c) => {
            const used = c.creditUsed ?? 0; const limit = c.creditLimit ?? 1;
            return (
              <div key={c.id} className="rounded-lg border border-[var(--border)] p-4">
                <div className="flex items-center gap-2 mb-2"><InstLogo id={c.institutionId} /><span className="text-sm font-medium truncate">{c.name}</span></div>
                <Money value={used} className="text-lg font-semibold" />
                <Progress value={used} max={limit} className="mt-2" />
                <div className="flex justify-between text-xs text-muted mt-1"><span>{Math.round((used / limit) * 100)}% usado</span><span>Limite {brl(limit)}</span></div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mb-5">
        <CardTitle action={<Money value={totalBalance} className="text-positive font-bold" />}>Contas Bancárias ({banks.length})</CardTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {banks.map((b) => (
            <div key={b.id} className="rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center gap-2 mb-2"><InstLogo id={b.institutionId} /><span className="text-sm font-medium truncate">{b.name}</span></div>
              <Money value={b.balance} className="text-lg font-semibold" />
              <p className="text-xs text-muted mt-1">Sincronizado {new Date(b.lastSyncAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Conexões</CardTitle>
        <div className="space-y-2">
          {institutions.map((i) => (
            <div key={i.id} className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
              <InstLogo id={i.id} size={32} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{i.name}</div>
                <div className="text-xs text-muted">{i.accounts} conta(s) vinculada(s)</div>
              </div>
              <Badge tone={statusMap[i.status].tone}>{statusMap[i.status].label}</Badge>
              <button className="text-xs text-muted hover:text-brand px-2">Espaços</button>
              <button className="text-xs text-danger hover:underline px-2">Desconectar</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
