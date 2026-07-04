"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Shield, Bell, CreditCard } from "lucide-react";

export default function ProfilePage() {
  async function manageSubscription() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (!res.ok || !data.url) { alert(data.error || "Sem assinatura ativa."); return; }
    window.location.href = data.url;
  }
  return (
    <div>
      <PageHeader title="Perfil" subtitle="Conta, notificações, privacidade e plano" />
      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardTitle>Conta</CardTitle>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-brand/20 grid place-items-center text-brand font-bold">F</div>
            <div><div className="font-medium">Felipe</div><div className="text-sm text-muted">felipeatalaia.s7@gmail.com</div></div>
            <Badge tone="brand" className="ml-auto">Premium</Badge>
          </div>
          <div className="space-y-2 text-sm">
            <Row icon={<CreditCard size={16} />} label="Plano Premium" value="R$ 34,90/mês · renova 05/07" />
            <Row icon={<Bell size={16} />} label="Notificações" value="Email + Push ativos" />
            <Row icon={<Shield size={16} />} label="Privacidade (LGPD)" value="Consentimento ativo" />
          </div>
          <button onClick={manageSubscription} className="mt-4 w-full h-10 rounded-xl border border-[var(--border)] text-sm font-medium hover:border-[var(--accent)]/40 transition-colors">Gerenciar assinatura</button>
        </Card>

        <Card>
          <CardTitle>Programa de indicação</CardTitle>
          <div className="text-center py-3">
            <Gift size={32} className="mx-auto text-brand mb-2" />
            <p className="font-medium">Convide amigos, ganhe meses grátis</p>
            <p className="text-sm text-muted mb-3">1 mês de Premium por amigo que assinar.</p>
            <div className="flex gap-2 max-w-sm mx-auto">
              <input readOnly value="lumina.app/r/felipe" className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm" />
              <button className="bg-brand text-white px-3 py-2 rounded-lg text-sm font-medium">Copiar</button>
            </div>
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div><div className="font-bold text-lg">3</div><div className="text-muted text-xs">convites aceitos</div></div>
              <div><div className="font-bold text-lg">3</div><div className="text-muted text-xs">meses grátis</div></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
      <span className="text-muted">{icon}</span>
      <span className="flex-1">{label}</span>
      <span className="text-muted text-xs">{value}</span>
    </div>
  );
}
