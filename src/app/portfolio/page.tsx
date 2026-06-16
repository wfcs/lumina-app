"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Money } from "@/components/ui/money";
import { assets, debts, netWorthHistory, totalAssets, totalDebts } from "@/lib/mock-data";
import { brl } from "@/lib/format";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, TrendingUp } from "lucide-react";

const ranges = ["1M", "3M", "YTD", "1Y", "ALL"];

export default function PortfolioPage() {
  const [tab, setTab] = useState<"assets" | "debts">("assets");
  const [range, setRange] = useState("3M");
  const ativos = totalAssets();
  const dividas = totalDebts();
  const net = ativos - dividas;

  return (
    <div>
      <PageHeader title="Patrimônio" subtitle="Ativos totais menos dívidas totais" />

      <Card className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div><h3 className="text-sm text-muted">Patrimônio líquido</h3><Money value={net} className="text-3xl font-bold" /></div>
          <div className="text-right">
            <Badge tone="positive"><TrendingUp size={12} /> +6,9% no mês</Badge>
            <div className="text-xs text-muted mt-1">Ativos {brl(ativos)} · Dívidas {brl(dividas)}</div>
          </div>
        </div>
        <div className="flex gap-1 mb-2">{ranges.map((r) => <button key={r} onClick={() => setRange(r)} className={`px-2.5 py-1 rounded text-xs font-medium ${r === range ? "bg-brand text-white" : "text-muted"}`}>{r}</button>)}</div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={netWorthHistory}>
              <defs><linearGradient id="pw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} /><stop offset="100%" stopColor="#2563EB" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => brl(v)} />
              <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2.5} fill="url(#pw)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5 mb-5">
        <button onClick={() => setTab("assets")} className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === "assets" ? "bg-brand text-white" : "text-muted"}`}>Ativos ({assets.length})</button>
        <button onClick={() => setTab("debts")} className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === "debts" ? "bg-brand text-white" : "text-muted"}`}>Dívidas ({debts.length})</button>
      </div>

      {tab === "assets" ? (
        <Card>
          <CardTitle action={<button className="text-brand text-xs font-medium inline-flex items-center gap-1"><Plus size={14} /> Adicionar investimento</button>}>Alocação</CardTitle>
          <div className="flex rounded-full overflow-hidden h-3 mb-2">{assets.map((a) => <div key={a.id} style={{ width: `${a.weight * 100}%`, background: a.color }} />)}</div>
          <div className="flex flex-wrap gap-3 text-xs text-muted mb-4">{assets.map((a) => <span key={a.id} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />{a.group} {(a.weight * 100).toFixed(0)}%</span>)}</div>
          <div className="space-y-2">
            {assets.map((a) => (
              <div key={a.id} className="flex items-center gap-3 text-sm py-1.5 border-b border-[var(--border)] last:border-0">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: a.color }} />
                <span className="flex-1 truncate">{a.name}</span>
                <span className="w-28 hidden sm:block"><Progress value={a.weight * 100} /></span>
                <span className="text-muted w-12 text-right">{(a.weight * 100).toFixed(0)}%</span>
                <Money value={a.value} className="font-medium w-28 text-right" />
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card>
          <CardTitle action={<button className="text-brand text-xs font-medium inline-flex items-center gap-1"><Plus size={14} /> Adicionar dívida</button>}>Empréstimos e financiamentos</CardTitle>
          <div className="space-y-3">
            {debts.map((d) => (
              <div key={d.id} className="flex items-center gap-3 text-sm py-2 border-b border-[var(--border)] last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{d.name}</div>
                  <div className="text-xs text-muted">Contrato {d.contract} · {d.paid}/{d.total} parcelas</div>
                  <Progress value={d.paid} max={d.total} className="mt-1.5 max-w-xs" />
                </div>
                <Badge tone={d.status === "Em dia" ? "positive" : "danger"}>{d.status}</Badge>
                <Money value={-d.balance} className="text-danger font-medium w-28 text-right" />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
