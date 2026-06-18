"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Landmark, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

const PluggyConnect = dynamic(
  () => import("react-pluggy-connect").then((m) => m.PluggyConnect),
  { ssr: false }
);

type Mode = "loading" | "live" | "mock" | "error";

export default function ConnectPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadToken() {
    setMode("loading");
    setNote(null);
    fetch("/api/pluggy/connect-token")
      .then((r) => r.json())
      .then((d) => {
        setMode(d.mode === "live" ? "live" : d.mode === "mock" ? "mock" : "error");
        setToken(d.token ?? null);
        setNote(d.note ?? null);
      })
      .catch((e) => { setMode("error"); setNote(String(e)); });
  }
  useEffect(() => { loadToken(); }, []);

  async function handleSuccess(itemData: any) {
    setOpen(false);
    setSyncing(true);
    setError(null);
    try {
      const itemId = itemData?.item?.id;
      const res = await fetch("/api/pluggy/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao sincronizar.");
      router.replace("/");
      router.refresh();
    } catch (e: any) {
      setSyncing(false);
      setError(e.message ?? "Erro ao sincronizar os dados.");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 relative overflow-hidden">
      <div className="orb h-80 w-80 -top-10 -left-10" style={{ background: "radial-gradient(circle, #8332AC, transparent 70%)" }} />
      <div className="orb h-72 w-72 bottom-0 right-0 animate-float" style={{ background: "radial-gradient(circle, #E086D3, transparent 70%)" }} />

      <div className="relative w-full max-w-md">
        <div className="card p-6 text-center">
          <div className="h-12 w-12 rounded-2xl grid place-items-center mx-auto mb-4 shadow-glow-violet"
               style={{ background: "linear-gradient(135deg, #8332AC, #E086D3)" }}>
            <Landmark size={22} className="text-white" />
          </div>
          <h1 className="font-display text-xl font-bold">Conecte seu primeiro banco</h1>
          <p className="text-sm text-muted mt-1 mb-6">
            Via Open Finance, com segurança. O Lumina só lê seus dados — nunca move dinheiro.
            Conecte ao menos uma instituição para ver seu painel com dados reais.
          </p>

          {syncing ? (
            <div className="flex items-center justify-center gap-2 text-sm py-3">
              <Loader2 size={18} className="animate-spin text-[var(--accent)]" /> Sincronizando suas contas…
            </div>
          ) : (
            <>
              {mode === "live" && token && (
                <button
                  onClick={() => setOpen(true)}
                  className="w-full h-12 rounded-xl font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #8332AC, #E086D3)" }}
                >
                  Conectar banco
                </button>
              )}
              {mode === "mock" && (
                <div className="flex items-start gap-2 text-left text-sm rounded-lg border border-warn/30 bg-warn/10 px-3 py-2">
                  <AlertCircle size={16} className="text-warn mt-0.5 shrink-0" />
                  <span>Pluggy ainda não configurado no servidor. Defina <code>PLUGGY_CLIENT_ID</code> e <code>PLUGGY_CLIENT_SECRET</code> e reinicie o servidor.</span>
                </div>
              )}
              {mode === "error" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-danger rounded-lg border border-danger/30 bg-danger/10 px-3 py-2">
                    <AlertCircle size={16} /> Não foi possível iniciar a conexão.
                  </div>
                  {note && (
                    <p className="text-[11px] text-muted break-words rounded-lg border border-[var(--border)] bg-[var(--card-2)] px-3 py-2 text-left">
                      Detalhe: {note}
                    </p>
                  )}
                  <button onClick={loadToken} className="text-xs text-[var(--accent)] font-semibold">Tentar novamente</button>
                </div>
              )}
              {mode === "loading" && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted py-3">
                  <Loader2 size={16} className="animate-spin" /> Preparando…
                </div>
              )}
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-danger mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-[11px] text-muted mt-5">
            <ShieldCheck size={13} className="text-[var(--mint)]" />
            Regulado pelo Banco Central (Open Finance) · dados protegidos pela LGPD
          </div>
        </div>

        <form action="/auth/signout" method="post" className="text-center mt-4">
          <button className="text-xs text-muted hover:text-[var(--text)]">Sair desta conta</button>
        </form>
      </div>

      {open && token && (
        <PluggyConnect
          connectToken={token}
          includeSandbox
          onSuccess={handleSuccess}
          onError={() => setError("Não foi possível concluir a conexão.")}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
