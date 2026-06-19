"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import type { DbAccount, DbTransaction } from "@/lib/data";
import { brl } from "@/lib/format";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { AlertTriangle, TrendingUp } from "lucide-react";

const tt = { background: "#1C1C22", border: "1px solid #2C2C34", borderRadius: 12, color: "#EAEEF6", fontSize: 12 };
const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function ProjectionReal({ accounts, transactions }: { accounts: DbAccount[]; transactions: DbTransaction[] }) {
  const start = accounts.filter((a) => (a.type ?? "").toUpperCase() !== "CREDIT").reduce((s, a) => s + a.balance, 0);

  const months = Array.from(new Set(transactions.map((t) => t.date.slice(0, 7))));
  const n = Math.max(1, months.length);
  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const avgIncome = totalIncome / n;
  const avgExpense = totalExpense / n;
  const monthlyNet = avgIncome - avgExpense;

  const now = new Date();
  let bal = start;
  const data = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
    bal += monthlyNet;
    return { label: `${MES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`, saldo: Math.round(bal) };
  });
  const negativeMonth = data.find((d) => d.saldo < 0);

  return (
    <div>
      <PageHeader title="Projeção" subtitle="Estimativa de saldo dos próximos 6 meses (com base no seu histórico)" />

      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <Card><CardTitle>Saldo atual</CardTitle><Money value={start} className="text-2xl font-bold" /><p className="text-xs text-muted mt-1">contas (sem cartões)</p></Card>
        <Card><CardTitle>Resultado médio/mês</CardTitle><Money value={monthlyNet} colorize className="text-2xl font-bold" /><p className="text-xs text-muted mt-1">média de {n} {n === 1 ? "mês" : "meses"}</p></Card>
        <Card><CardTitle>Saldo em 6 meses</CardTitle><Money value={data[5].saldo} colorize className="text-2xl font-bold" /><p className="text-xs text-muted mt-1">projetado</p></Card>
      </div>

      {negativeMonth ? (
        <div className="rounded-xl border border-danger/30 bg-danger/10 p-4 mb-5 flex items-center gap-2 text-sm"><AlertTriangle size={18} className="text-danger shrink-0" /> Seu saldo projetado fica negativo em <b>{negativeMonth.label}</b>. Reveja gastos recorrentes.</div>
      ) : (
        <div className="rounded-xl border border-[var(--mint)]/30 bg-[var(--mint)]/10 p-4 mb-5 flex items-center gap-2 text-sm"><TrendingUp size={18} className="text-[var(--mint)] shrink-0" /> Saldo projetado positivo nos próximos 6 meses, mantendo o ritmo atual.</div>
      )}

      <Card>
        <CardTitle>Saldo projetado</CardTitle>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs><linearGradient id="pj" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8332AC" stopOpacity={0.3} /><stop offset="100%" stopColor="#E086D3" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tt} formatter={(v: number) => brl(v)} />
              <ReferenceLine y={0} stroke="#FF6B7A" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Area type="monotone" dataKey="saldo" stroke="#9D4EDD" strokeWidth={2.5} fill="url(#pj)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted mt-3">Projeção linear: saldo atual + resultado médio mensal (média do histórico disponível). Quanto mais meses, mais precisa.</p>
      </Card>
    </div>
  );
}
