"use client";
import Link from "next/link";
import { Landmark, FileUp, ArrowRight, ShieldCheck, Clock } from "lucide-react";

export default function ConnectChoicePage() {
  return (
    <div className="min-h-screen grid place-items-center px-4 relative overflow-hidden">
      <div className="orb h-80 w-80 -top-10 -left-10" style={{ background: "radial-gradient(circle, #8332AC, transparent 70%)" }} />
      <div className="orb h-72 w-72 bottom-0 right-0 animate-float" style={{ background: "radial-gradient(circle, #E086D3, transparent 70%)" }} />

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-bold">Como deseja trazer seus dados?</h1>
          <p className="text-sm text-muted mt-1">Conecte ao menos uma fonte para ver seu painel com dados reais.</p>
        </div>

        <div className="space-y-3">
          {/* Open Finance — em desenvolvimento */}
          <Link href="/connect/openfinance" className="card p-5 flex items-center gap-4 hover:border-[var(--accent)]/50 transition-colors group">
            <div className="h-12 w-12 rounded-2xl grid place-items-center shrink-0 shadow-glow-violet" style={{ background: "linear-gradient(135deg, #8332AC, #E086D3)" }}>
              <Landmark size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Conectar via Open Finance</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-warn/30 bg-warn/10 text-warn"><Clock size={10} /> Em desenvolvimento</span>
              </div>
              <p className="text-sm text-muted mt-0.5">Conexão automática com o banco, regulada pelo Banco Central. Sincroniza sozinho.</p>
            </div>
            <ArrowRight size={18} className="text-muted group-hover:text-[var(--accent)] shrink-0" />
          </Link>

          {/* OFX / CSV */}
          <Link href="/connect/import" className="card p-5 flex items-center gap-4 hover:border-[var(--mint)]/50 transition-colors group">
            <div className="h-12 w-12 rounded-2xl grid place-items-center shrink-0 border border-[var(--mint)]/30 bg-[var(--mint)]/10">
              <FileUp size={22} className="text-[var(--mint)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Importar extrato (OFX/CSV)</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border border-[var(--mint)]/30 bg-[var(--mint)]/10 text-[var(--mint)]">Disponível</span>
              </div>
              <p className="text-sm text-muted mt-0.5">Baixe o extrato no seu banco (OFX ou CSV) e suba aqui. Funciona com qualquer banco, sem custo.</p>
            </div>
            <ArrowRight size={18} className="text-muted group-hover:text-[var(--mint)] shrink-0" />
          </Link>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-muted mt-5">
          <ShieldCheck size={13} className="text-[var(--mint)]" />
          Seus dados são protegidos pela LGPD. O Lumina só lê — nunca move dinheiro.
        </div>
        <form action="/auth/signout" method="post" className="text-center mt-3">
          <button className="text-xs text-muted hover:text-[var(--text)]">Sair desta conta</button>
        </form>
      </div>
    </div>
  );
}
