"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LuminaMark } from "@/components/ui/lumina-mark";

type Provider = "google" | "azure" | "discord";

const providers: { id: Provider; label: string; logo: React.ReactNode }[] = [
  { id: "google", label: "Continuar com Google", logo: <GoogleLogo /> },
  { id: "azure", label: "Continuar com Microsoft", logo: <MicrosoftLogo /> },
  { id: "discord", label: "Continuar com Discord", logo: <DiscordLogo /> },
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
          <LuminaMark size={46} />
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
function DiscordLogo() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.32 4.37A19.8 19.8 0 0 0 15.45 2.86a.07.07 0 0 0-.08.04c-.21.38-.44.87-.61 1.25a18.27 18.27 0 0 0-5.5 0 12.6 12.6 0 0 0-.62-1.25.08.08 0 0 0-.08-.04 19.74 19.74 0 0 0-4.88 1.51.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.05 19.9 19.9 0 0 0 5.99 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.29 1.23-1.99a.08.08 0 0 0-.04-.11c-.65-.25-1.27-.55-1.87-.89a.08.08 0 0 1-.01-.13c.13-.09.25-.19.37-.29a.07.07 0 0 1 .08-.01c3.93 1.79 8.18 1.79 12.06 0a.07.07 0 0 1 .08.01c.12.1.24.2.37.29a.08.08 0 0 1-.01.13c-.6.35-1.22.64-1.87.89a.08.08 0 0 0-.04.11c.36.7.78 1.36 1.23 1.99a.08.08 0 0 0 .08.03 19.84 19.84 0 0 0 6-3.03.08.08 0 0 0 .03-.05c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Z"/></svg>);
}
