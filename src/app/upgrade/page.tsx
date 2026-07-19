"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LuminaMark } from "@/components/ui/lumina-mark";
import { Check, AlertCircle, Loader2, Ticket } from "lucide-react";

const plans = [
  { id: "pro", name: "Pro", price: "R$ 19,90", per: "/mês", feats: ["Importação OFX/CSV ilimitada", "Histórico completo", "Categorias e fluxo de caixa"] },
  { id: "premium", name: "Premium", price: "R$ 34,90", per: "/mês", feats: ["Tudo do Pro", "Open Finance automático", "Projeção e patrimônio", "Suporte prioritário"], featured: true },
];

export default function UpgradePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function redeem() {
    if (!code.trim()) return;
    setBusy(true); setError(null); setOk(null);
    try {
      const res = await fetch("/api/redeem-token", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Token inválido.");
      setOk(`Acesso liberado por mais ${data.days} dia(s)!`);
      setTimeout(() => { router.replace("/"); router.refresh(); }, 1200);
    } catch (e: any) {
      setError(e.message ?? "Erro ao resgatar token.");
    } finally { setBusy(false); }
  }

  async function subscribe(plan: string) {
    setLoadingPlan(plan); setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Falha ao iniciar o pagamento.");
      window.location.href = data.url;
    } catch (e: any) {
      setError(e.message ?? "Erro no pagamento.");
      setLoadingPlan(null);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 py-10 relative overflow-hidden">
      <div className="orb h-80 w-80 -top-10 -left-10" style={{ background: "radial-gradient(circle, #7C3AED, transparent 70%)" }} />
      <div className="relative w-full max-w-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <LuminaMark size={44} className="mb-3" />
          <h1 className="font-display text-2xl font-bold">Seu período de teste terminou</h1>
          <p className="text-sm text-muted mt-1">Escolha um plano para continuar — ou resgate um token de acesso.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          {plans.map((p) => (
            <div key={p.id} className={`card p-5 ${p.featured ? "border-[var(--accent)]/50" : ""}`}>
              {p.featured && <span className="inline-block mb-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]">Recomendado</span>}
              <div className="font-display font-bold text-lg">{p.name}</div>
              <div className="flex items-baseline gap-1 mt-1 mb-3"><span className="text-2xl font-bold num">{p.price}</span><span className="text-muted text-sm">{p.per}</span></div>
              <ul className="space-y-1.5 mb-4">
                {p.feats.map((f) => <li key={f} className="flex items-start gap-2 text-sm"><Check size={15} className="text-[var(--mint)] mt-0.5 shrink-0" /> {f}</li>)}
              </ul>
              <button onClick={() => subscribe(p.id)} disabled={loadingPlan !== null} className="w-full h-11 rounded-xl font-semibold text-white disabled:opacity-60" style={{ background: "linear-gradient(135deg, #7C3AED, #D7B8F3)" }}>{loadingPlan === p.id ? "Redirecionando…" : `Assinar ${p.name}`}</button>
            </div>
          ))}
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3"><Ticket size={18} className="text-[var(--accent)]" /><h3 className="font-semibold">Tenho um token de acesso</h3></div>
          {ok ? (
            <div className="flex items-center gap-2 text-sm text-[var(--mint)]"><Check size={16} /> {ok}</div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="LUM-XXXX-XXXX-XXXX"
                className="flex-1 h-11 px-3 rounded-xl border border-[var(--border)] bg-[var(--card-2)] num text-sm outline-none focus:border-[var(--accent)]" />
              <button onClick={redeem} disabled={busy || !code.trim()}
                className="h-11 px-5 rounded-xl font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #7C3AED, #D7B8F3)" }}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : "Resgatar"}
              </button>
            </div>
          )}
          {error && <div className="flex items-center gap-2 text-sm text-danger mt-2"><AlertCircle size={15} /> {error}</div>}
        </div>

        <form action="/auth/signout" method="post" className="text-center mt-4">
          <button className="text-xs text-muted hover:text-[var(--text)]">Sair desta conta</button>
        </form>
      </div>
    </div>
  );
}
