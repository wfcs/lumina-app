"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { projection } from "@/lib/mock-data";
import { brl } from "@/lib/format";
import { ComposedChart, Bar, Line, XAxis, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { AlertTriangle, TrendingUp, Info } from "lucide-react";

const horizons = ["3M", "6M", "12M"];

export default function ProjectionPage() {
  const [h, setH] = useState("6M");
  const n = h === "3M" ? 3 : 6;
  const data = projection.slice(0, n).map((p) => ({
    month: p.month, Receitas: p.income, Recorrências: p.recurring, Parcelamentos: p.installments,
    "Dia a dia": p.daily, "A confirmar": p.toConfirm, Saldo: p.balance,
  }));

  return (
    <div>
      <PageHeader title="Projeção" subtitle="Para onde seu saldo está indo nos próximos meses" action={
        <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5">
          {horizons.map((x) => <button key={x} onClick={() => setH(x)} className={`px-3 py-1.5 rounded-md text-sm font-medium ${x === h ? "bg-brand text-white" : "text-muted"}`}>{x}</button>)}
        </div>
      } />

      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl border border-brand/40 bg-brand/5 p-4 flex gap-2"><TrendingUp size={18} className="text-brand shrink-0" /><span className="text-sm">R$ 323/mês será liberado em <b>Set</b> quando as parcelas terminarem.</span></div>
        <div className="rounded-xl border border-[var(--border)] p-4 flex gap-2"><Info size={18} className="text-muted shrink-0" /><span className="text-sm">Adicione receitas recorrentes para uma projeção mais precisa. <a href="/recurring" className="text-brand font-medium">Configurar →</a></span></div>
        <div className="rounded-xl border border-positive/40 bg-positive/5 p-4 flex gap-2"><TrendingUp size={18} className="text-positive shrink-0" /><span className="text-sm">Seu saldo projetado cresce de forma saudável no período.</span></div>
      </div>

      <Card className="mb-5">
        <CardTitle>Projeção mensal</CardTitle>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => brl(v)} />
              <Legend />
              <ReferenceLine y={0} stroke="#cbd5e1" />
              <Bar dataKey="Receitas" stackId="a" fill="#16A34A" />
              <Bar dataKey="Recorrências" stackId="a" fill="#DC2626" />
              <Bar dataKey="Parcelamentos" stackId="a" fill="#F97316" />
              <Bar dataKey="Dia a dia" stackId="a" fill="#6B7280" />
              <Bar dataKey="A confirmar" stackId="a" fill="#2563EB" />
              <Line type="monotone" dataKey="Saldo" stroke="#111827" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardTitle>Detalhamento mês a mês</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted text-xs uppercase border-b border-[var(--border)]">
              <tr><th className="text-left p-2">Mês</th><th className="text-right p-2">Saldo inicial</th><th className="text-right p-2">Receitas</th><th className="text-right p-2">Gastos</th><th className="text-right p-2">Saldo projetado</th></tr>
            </thead>
            <tbody>
              {projection.slice(0, n).map((p, i) => {
                const gastos = p.recurring + p.installments + p.daily + p.toConfirm;
                const inicial = i === 0 ? 9210 : projection[i - 1].balance;
                return (
                  <tr key={p.month} className="border-b border-[var(--border)] last:border-0">
                    <td className="p-2 font-medium">{p.month}</td>
                    <td className="p-2 text-right"><Money value={inicial} /></td>
                    <td className="p-2 text-right text-positive">{brl(p.income)}</td>
                    <td className="p-2 text-right text-danger">{brl(gastos)}</td>
                    <td className="p-2 text-right"><Money value={p.balance} colorize className="font-semibold" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted mt-3">Dia a dia = média dos últimos 3 meses de gastos avulsos. Parcelamentos consideram a data de término conhecida.</p>
      </Card>
    </div>
  );
}
