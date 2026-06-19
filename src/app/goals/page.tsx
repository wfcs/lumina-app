"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Target } from "lucide-react";

export default function GoalsPage() {
  return (
    <div>
      <PageHeader title="Metas" subtitle="Defina objetivos de economia e acompanhe o progresso" />
      <Card className="text-center py-16">
        <Target size={40} className="mx-auto text-muted mb-3" />
        <p className="font-semibold">Você ainda não tem metas</p>
        <p className="text-muted text-sm mb-4 max-w-md mx-auto">
          Metas são definidas por você (não vêm do banco). A criação e o acompanhamento automático de metas
          a partir do seu saldo entram numa próxima atualização.
        </p>
        <button disabled className="bg-[var(--card-2)] border border-[var(--border)] text-muted px-4 py-2 rounded-xl text-sm font-medium cursor-not-allowed">
          Nova meta (em breve)
        </button>
      </Card>
    </div>
  );
}
