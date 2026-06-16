"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Money } from "@/components/ui/money";
import { InstLogo } from "@/components/ui/inst-logo";
import { recurring, recurringForecast, catById } from "@/lib/mock-data";
import { brl, shortDate } from "@/lib/format";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

export default function RecurringPage() {
  const [tab, setTab] = useState<"expense" | "income">("expense");
  const fixed = recurring.filter((r) => r.kind === "fixed");
  const installments = recurring.filter((r) => r.kind === "installment");
  const totalFixed = fixed.reduce((s, r) => s + r.amount, 0);
  const totalInst = installments.reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <PageHeader
        title="Recorrentes"
        subtitle="Contas fixas e parcelas detectadas automaticamente"
        action={<button className="inline-flex items-center gap-1.5 bg-brand text-white px-3 py-2 rounded-lg text-sm font-medium"><Plus size={16} /> Nova Recorrência</button>}
      />

      <div className="flex items-center gap-2 mb-4">
        <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5">
          <button onClick={() => setTab("expense")} className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === "expense" ? "bg-brand text-white" : "text-muted"}`}>Despesas</button>
          <button onClick={() => setTab("income")} className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === "income" ? "bg-brand text-white" : "text-muted"}`}>Receitas</button>
        </div>
        <div className="ml-auto inline-flex items-center gap-2 text-sm">
          <button className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5"><ChevronLeft size={16} /></button>
          <span className="font-medium">Jun 2026</span>
          <button className="p-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardTitle>Próximos 6 meses</CardTitle>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recurringForecast}>
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => brl(v)} />
                <Legend />
                <Bar dataKey="fixed" name="Contas fixas" stackId="a" fill="#2563EB" radius={[0, 0, 0, 0]} />
                <Bar dataKey="installment" name="Parcelas" stackId="a" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>Resumo de junho</CardTitle>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted">Contas fixas</span><Money value={totalFixed} className="font-medium" /></div>
            <div className="flex justify-between"><span className="text-muted">Parcelas</span><Money value={totalInst} className="font-medium" /></div>
            <div className="flex justify-between border-t border-[var(--border)] pt-3"><span className="font-medium">Total</span><Money value={totalFixed + totalInst} className="font-semibold" /></div>
            <div className="flex justify-between"><span className="text-muted">Sobra prevista</span><Money value={12500 - totalFixed - totalInst} className="text-positive font-medium" /></div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-5">
        <Card>
          <CardTitle>Parcelas</CardTitle>
          <div className="space-y-3">
            {installments.map((r) => (
              <div key={r.id} className="flex items-center gap-3">
                <InstLogo id={r.institutionId} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{r.emoji} {r.name}</div>
                  <Progress value={r.installmentCurrent!} max={r.installmentTotal!} className="mt-1.5" />
                  <div className="text-xs text-muted mt-1">{r.installmentCurrent}/{r.installmentTotal} parcelas · próxima {shortDate(r.nextDueDate)}</div>
                </div>
                <Money value={-r.amount} className="text-danger font-medium" />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle>Contas fixas</CardTitle>
          <div className="space-y-2">
            {fixed.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-1.5">
                <InstLogo id={r.institutionId} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{r.emoji} {r.name}</div>
                  <div className="text-xs text-muted">{catById(r.categoryId)?.name} · {r.frequency}</div>
                </div>
                <div className="text-right">
                  <Money value={-r.amount} className="text-danger font-medium block" />
                  <Badge tone="neutral" className="mt-0.5">{shortDate(r.nextDueDate)}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
