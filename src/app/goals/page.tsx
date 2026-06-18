"use client";
import { ExampleBanner } from "@/components/ui/example-banner";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Money } from "@/components/ui/money";
import { goals } from "@/lib/mock-data";
import { brl } from "@/lib/format";
import { Plus, Target } from "lucide-react";

export default function GoalsPage() {
  const today = new Date("2026-06-16");
  return (
    <div>
      <ExampleBanner />
      <PageHeader title="Metas" subtitle="Acompanhe seus objetivos financeiros" action={<button className="inline-flex items-center gap-1.5 bg-brand text-white px-3 py-2 rounded-lg text-sm font-medium"><Plus size={16} /> Nova Meta</button>} />

      {goals.length === 0 ? (
        <Card className="text-center py-16">
          <Target size={40} className="mx-auto text-muted mb-3" />
          <p className="font-medium">Você ainda não tem metas</p>
          <p className="text-muted text-sm mb-4">Crie sua primeira meta e comece a guardar com propósito.</p>
          <button className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium">Nova Meta</button>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const p = (g.current / g.target) * 100;
            const months = Math.max(1, Math.round((new Date(g.targetDate).getTime() - today.getTime()) / 86400000 / 30));
            const perMonth = (g.target - g.current) / months;
            const days = Math.round((new Date(g.targetDate).getTime() - today.getTime()) / 86400000);
            return (
              <Card key={g.id}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{g.emoji}</span>
                  <span className="text-xs text-muted">{days} dias restantes</span>
                </div>
                <h3 className="font-semibold">{g.name}</h3>
                <div className="flex items-baseline gap-1 mt-1 mb-3"><Money value={g.current} className="text-xl font-bold" /><span className="text-muted text-sm">/ {brl(g.target)}</span></div>
                <Progress value={g.current} max={g.target} />
                <div className="flex justify-between text-xs mt-2"><span className="text-muted">{Math.round(p)}% concluído</span><span className="text-brand font-medium">Guarde {brl(perMonth)}/mês</span></div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
