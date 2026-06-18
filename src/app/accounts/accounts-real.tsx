"use client";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Money } from "@/components/ui/money";
import { PageHeader } from "@/components/ui/page-header";
import { brl } from "@/lib/format";
import type { DbAccount, DbConnection } from "@/lib/data";
import { Plus, Landmark } from "lucide-react";

const statusMap: Record<string, { tone: "positive" | "warn" | "danger"; label: string }> = {
  updated: { tone: "positive", label: "Atualizado" },
  unstable: { tone: "warn", label: "Atualizando" },
  expired: { tone: "danger", label: "Expirado" },
};

function Logo({ url, size = 28 }: { url: string | null; size?: number }) {
  if (url) return <img src={url} alt="" width={size} height={size} className="rounded-lg object-contain bg-white/90 p-0.5 shrink-0" />;
  return <div className="rounded-lg grid place-items-center bg-[var(--card-2)] text-muted shrink-0" style={{ width: size, height: size }}><Landmark size={size * 0.55} /></div>;
}

export function AccountsReal({ accounts, connections }: { accounts: DbAccount[]; connections: DbConnection[] }) {
  const connById = new Map(connections.map((c) => [c.id, c]));
  const cards = accounts.filter((a) => (a.type ?? "").toUpperCase() === "CREDIT");
  const banks = accounts.filter((a) => (a.type ?? "").toUpperCase() !== "CREDIT");
  const totalDebt = cards.reduce((s, c) => s + Math.abs(c.balance), 0);
  const totalBalance = banks.reduce((s, b) => s + b.balance, 0);

  return (
    <div>
      <PageHeader title="Contas" subtitle="Tudo que está conectado via Open Finance" action={
        <a href="/connect" className="inline-flex items-center gap-1.5 text-white px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: "linear-gradient(135deg, #8332AC, #E086D3)" }}><Plus size={16} /> Adicionar banco</a>
      } />

      {cards.length > 0 && (
        <Card className="mb-5">
          <CardTitle action={<Money value={-totalDebt} className="text-danger font-bold" />}>Cartões de Crédito ({cards.length})</CardTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cards.map((c) => {
              const used = Math.abs(c.balance); const limit = c.credit_limit ?? 0;
              return (
                <div key={c.id} className="rounded-xl border border-[var(--border)] bg-[var(--card-2)] p-4">
                  <div className="flex items-center gap-2 mb-2"><Logo url={connById.get(c.connection_id)?.institution_image ?? null} /><span className="text-sm font-semibold truncate">{c.name ?? "Cartão"}</span></div>
                  <Money value={used} className="text-lg font-bold" />
                  {limit > 0 && <><Progress value={used} max={limit} className="mt-2" /><div className="flex justify-between text-xs text-muted mt-1 num"><span>{Math.round((used / limit) * 100)}% usado</span><span>Limite {brl(limit)}</span></div></>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="mb-5">
        <CardTitle action={<Money value={totalBalance} className="text-positive font-bold" />}>Contas Bancárias ({banks.length})</CardTitle>
        {banks.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma conta bancária encontrada nesta conexão.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {banks.map((b) => (
              <div key={b.id} className="rounded-xl border border-[var(--border)] bg-[var(--card-2)] p-4">
                <div className="flex items-center gap-2 mb-2"><Logo url={connById.get(b.connection_id)?.institution_image ?? null} /><span className="text-sm font-semibold truncate">{b.name ?? "Conta"}</span></div>
                <Money value={b.balance} className="text-lg font-bold" />
                <p className="text-xs text-muted mt-1">{b.subtype ?? b.type ?? ""}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Conexões</CardTitle>
        <div className="space-y-2">
          {connections.map((cn) => {
            const n = accounts.filter((a) => a.connection_id === cn.id).length;
            const st = statusMap[cn.status] ?? statusMap.unstable;
            return (
              <div key={cn.id} className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
                <Logo url={cn.institution_image} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{cn.institution_name ?? "Instituição"}</div>
                  <div className="text-xs text-muted">{n} conta(s) · sincronizado {cn.last_sync_at ? new Date(cn.last_sync_at).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</div>
                </div>
                <Badge tone={st.tone}>{st.label}</Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
