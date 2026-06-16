"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Money } from "@/components/ui/money";
import { categories, subcategories, spendByParentCategory } from "@/lib/mock-data";
import { brl } from "@/lib/format";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Plus, ChevronRight, MoreHorizontal } from "lucide-react";

export default function CategoriesPage() {
  const [tab, setTab] = useState<"cat" | "tags" | "auto">("cat");
  const [expanded, setExpanded] = useState<string | null>("alimentacao");
  const spend = spendByParentCategory();
  const spendMap = new Map(spend.map((s) => [s.id, s.value]));
  const expenseCats = categories.filter((c) => c.type === "expense");
  const totalSpent = spend.reduce((s, c) => s + c.value, 0);
  const totalLimit = expenseCats.reduce((s, c) => s + (c.monthlyLimit ?? 0), 0);
  const donut = [{ name: "Gasto", value: totalSpent, color: "#2563EB" }, { name: "Disponível", value: Math.max(0, totalLimit - totalSpent), color: "#E5E7EB" }];

  return (
    <div>
      <PageHeader title="Categorias" subtitle="Defina limites e acompanhe cada grupo de gasto" action={<button className="inline-flex items-center gap-1.5 bg-brand text-white px-3 py-2 rounded-lg text-sm font-medium"><Plus size={16} /> Nova Categoria</button>} />

      <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5 mb-5">
        {[["cat", "Categorias"], ["tags", "Tags"], ["auto", "Automações"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k as any)} className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === k ? "bg-brand text-white" : "text-muted"}`}>{l}</button>
        ))}
      </div>

      {tab === "cat" && (
        <div className="grid lg:grid-cols-3 gap-5">
          <Card>
            <CardTitle>Limite mensal</CardTitle>
            <div className="relative h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={donut} dataKey="value" innerRadius={55} outerRadius={75} stroke="none">{donut.map((d) => <Cell key={d.name} fill={d.color} />)}</Pie></PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center text-center"><div><Money value={totalSpent} className="font-bold" /><div className="text-xs text-muted">de {brl(totalLimit)}</div></div></div>
            </div>
          </Card>

          <Card className="lg:col-span-2 p-0 overflow-hidden">
            <div className="divide-y divide-[var(--border)]">
              {expenseCats.map((c) => {
                const spent = spendMap.get(c.id) ?? 0;
                const limit = c.monthlyLimit;
                const subs = subcategories.filter((s) => s.parentId === c.id);
                const isOpen = expanded === c.id;
                return (
                  <div key={c.id}>
                    <div className="flex items-center gap-3 p-3">
                      <button onClick={() => setExpanded(isOpen ? null : c.id)} className="text-muted"><ChevronRight size={16} className={`transition-transform ${isOpen ? "rotate-90" : ""}`} /></button>
                      <span className="text-lg">{c.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm"><span className="font-medium">{c.name}</span><span><Money value={spent} className="font-medium" /> <span className="text-muted text-xs">{limit ? `/ ${brl(limit)}` : "/ —"}</span></span></div>
                        <Progress value={spent} max={(limit ?? spent) || 1} className="mt-1.5" />
                      </div>
                      <button className="text-muted"><MoreHorizontal size={16} /></button>
                    </div>
                    {isOpen && subs.length > 0 && (
                      <div className="bg-black/[0.02] dark:bg-white/[0.02] px-3 pb-3 pt-1 space-y-2">
                        {subs.map((s) => (
                          <div key={s.id} className="flex items-center gap-3 pl-8 text-sm">
                            <span>{s.emoji}</span><span className="flex-1">{s.name}</span>
                            <span className="text-muted text-xs">limite {s.monthlyLimit ? brl(s.monthlyLimit) : "—"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === "tags" && (
        <Card>
          <CardTitle>Tags</CardTitle>
          <div className="flex flex-wrap gap-2">
            {["✈️ Viagem Janeiro", "🎁 Presente Mãe", "🏥 Plano de saúde", "🛠️ Reforma"].map((t) => (
              <span key={t} className="px-3 py-1.5 rounded-full text-sm border border-[var(--border)]">{t}</span>
            ))}
            <button className="px-3 py-1.5 rounded-full text-sm border border-dashed border-brand text-brand">+ Nova tag</button>
          </div>
        </Card>
      )}

      {tab === "auto" && (
        <Card>
          <CardTitle>Automações de categorização</CardTitle>
          <div className="space-y-2 text-sm">
            {[["descrição contém 'NETFLIX'", "📺 Streaming"], ["descrição contém 'UBER'", "🚕 Apps de mobilidade"], ["descrição contém 'IFOOD'", "🛵 Delivery"]].map(([rule, cat]) => (
              <div key={rule} className="flex items-center gap-2 rounded-lg border border-[var(--border)] p-3">
                <span className="text-muted">Se {rule}</span><ChevronRight size={14} className="text-muted" /><span className="font-medium">{cat}</span>
              </div>
            ))}
            <button className="text-brand text-sm font-medium">+ Nova automação</button>
          </div>
        </Card>
      )}
    </div>
  );
}
