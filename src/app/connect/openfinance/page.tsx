"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, AlertCircle, Loader2, ExternalLink, ArrowLeft } from "lucide-react";
import { LuminaMark } from "@/components/ui/lumina-mark";

type Mode = "loading" | "ready" | "notconfigured" | "error";

export default function OpenFinancePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("loading");
  const [url, setUrl] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bancomcp/connect-url")
      .then((r) => r.json())
      .then((d) => {
        if (!d.configured) return setMode("notconfigured");
        setUrl(d.url ?? null);
        setNote(d.note ?? null);
        setMode("ready");
      })
      .catch((e) => { setMode("error"); setNote(String(e)); });
  }, []);

  async function sync() {
    setSyncing(true); setError(null);
    try {
      const res = await fetch("/api/bancomcp/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao sincronizar.");
      router.replace("/"); router.refresh();
    } catch (e: any) {
      setSyncing(false);
      setError(e.message ?? "Erro ao sincronizar.");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 relative overflow-hidden">
      <div className="orb h-80 w-80 -top-10 -left-10" style={{ background: "radial-gradient(circle, #8332AC, transparent 70%)" }} />
      <div className="orb h-72 w-72 bottom-0 right-0 animate-float" style={{ background: "radial-gradient(circle, #E086D3, transparent 70%)" }} />

      <div className="relative w-full max-w-md">
        <a href="/connect" className="inline-flex items-center gap-1 text-xs text-muted hover:text-[var(--text)] mb-3"><ArrowLeft size={13} /> Voltar para as opções</a>
        <div className="card p-6 text-center">
          <div className="flex justify-center mb-4"><LuminaMark size={48} /></div>
          <h1 className="font-display text-xl font-bold">Conectar via Open Finance</h1>
          <p className="text-sm text-muted mt-1 mb-6">Autorize no site do seu banco (regulado pelo BACEN). O Lumina só lê — nunca move dinheiro.</p>

          {mode === "loading" && <div className="flex items-center justify-center gap-2 text-sm text-muted py-3"><Loader2 size={16} className="animate-spin" /> Preparando…</div>}

          {mode === "notconfigured" && (
            <div className="flex items-start gap-2 text-left text-sm rounded-lg border border-warn/30 bg-warn/10 px-3 py-2">
              <AlertCircle size={16} className="text-warn mt-0.5 shrink-0" />
              <span>Banco MCP não configurado no servidor. Defina <code>BANCOMCP_API_KEY</code> e reinicie.</span>
            </div>
          )}

          {mode === "ready" && !syncing && (
            <div className="space-y-2.5">
              {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer"
                   className="w-full h-12 rounded-xl font-semibold text-white flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #8332AC, #E086D3)" }}>
                  Conectar banco <ExternalLink size={16} />
                </a>
              ) : (
                <div className="text-sm text-muted rounded-lg border border-[var(--border)] bg-[var(--card-2)] px-3 py-2">Link de conexão indisponível. {note ? `(${note})` : ""}</div>
              )}
              <button onClick={sync} className="w-full h-11 rounded-xl border border-[var(--border)] bg-[var(--card-2)] text-sm font-semibold hover:border-[var(--mint)]/50">
                Já autorizei — sincronizar
              </button>
            </div>
          )}

          {syncing && <div className="flex items-center justify-center gap-2 text-sm py-3"><Loader2 size={18} className="animate-spin text-[var(--accent)]" /> Sincronizando suas contas…</div>}

          {error && <div className="flex items-center gap-2 text-sm text-danger mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2"><AlertCircle size={15} /> {error}</div>}

          <div className="flex items-center justify-center gap-2 text-[11px] text-muted mt-5">
            <ShieldCheck size={13} className="text-[var(--mint)]" /> Regulado pelo BACEN (Open Finance) · LGPD
          </div>
        </div>
      </div>
    </div>
  );
}
