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
        <p className="text-muted text-sm max-w-md mx-auto">
          Metas são definidas por você (não vêm do banco). Criar e acompanhar metas a partir do seu saldo
          chega numa próxima atualização. Enquanto isso, a reserva de emergência aparece na Visão Geral.
        </p>
      </Card>
    </div>
  );
}
