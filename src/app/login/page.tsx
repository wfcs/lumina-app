"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Provider = "google" | "azure" | "apple";

const providers: { id: Provider; label: string; logo: React.ReactNode }[] = [
  { id: "google", label: "Continuar com Google", logo: <GoogleLogo /> },
  { id: "azure", label: "Continuar com Microsoft", logo: <MicrosoftLogo /> },
  { id: "apple", label: "Continuar com Apple", logo: <AppleLogo /> },
];

export default function LoginPage() {
  const [loading, setLoading] = useState<Provider | null>(null);
  const supabase = createClient();

  async function signIn(provider: Provider) {
    setLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        ...(provider === "azure" ? { scopes: "email" } : {}),
      },
    });
    if (error) setLoading(null);
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 relative overflow-hidden">
      <div className="orb h-80 w-80 -top-10 -left-10" style={{ background: "radial-gradient(circle, #8332AC, transparent 70%)" }} />
      <div className="orb h-72 w-72 bottom-0 right-0 animate-float" style={{ background: "radial-gradient(circle, #E086D3, transparent 70%)" }} />

      <div className="relative w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-11 w-11 rounded-2xl grid place-items-center font-display font-bold text-white text-xl shadow-glow-violet"
               style={{ background: "linear-gradient(135deg, #8332AC, #E086D3)" }}>L</div>
          <div>
            <div className="font-display font-bold text-2xl tracking-tight">Lumina</div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted">Clareza financeira</div>
          </div>
        </div>

        <div className="card p-6">
          <h1 className="font-display text-xl font-bold mb-1">Entrar</h1>
          <p className="text-sm text-muted mb-6">Use uma conta para acessar o Lumina.</p>

          <div className="space-y-2.5">
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => signIn(p.id)}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-[var(--border)] bg-[var(--card-2)] text-sm font-semibold hover:border-[var(--accent)]/50 transition-colors disabled:opacity-60"
              >
                <span className="shrink-0">{p.logo}</span>
                {loading === p.id ? "Redirecionando…" : p.label}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-muted mt-6 text-center leading-relaxed">
            Ao continuar, você concorda em informar um CPF ou CNPJ válido na próxima etapa.
            Seus dados são protegidos conforme a LGPD.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.22V7.04H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"/></svg>
  );
}
function MicrosoftLogo() {
  return (<svg width="16" height="16" viewBox="0 0 23 23"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#7FBA00" d="M12 1h10v10H12z"/><path fill="#00A4EF" d="M1 12h10v10H1z"/><path fill="#FFB900" d="M12 12h10v10H12z"/></svg>);
}
function AppleLogo() {
  return (<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 12.04c-.03-2.6 2.13-3.85 2.22-3.91-1.21-1.77-3.1-2.01-3.77-2.04-1.6-.16-3.13.94-3.94.94-.81 0-2.07-.92-3.4-.9-1.75.03-3.36 1.02-4.26 2.58-1.82 3.16-.47 7.84 1.3 10.4.86 1.26 1.89 2.67 3.24 2.62 1.3-.05 1.79-.84 3.36-.84s2.01.84 3.39.81c1.4-.02 2.28-1.28 3.13-2.55.99-1.46 1.4-2.88 1.42-2.95-.03-.01-2.72-1.04-2.75-4.16.02-.01.84-.45.81-.45ZM14.5 4.7c.72-.87 1.2-2.08 1.07-3.29-1.03.04-2.28.69-3.02 1.56-.66.77-1.24 2-1.09 3.18 1.15.09 2.32-.58 3.04-1.45Z"/></svg>);
}
