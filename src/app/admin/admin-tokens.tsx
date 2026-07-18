"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, Copy, Check, Loader2, AlertCircle } from "lucide-react";

type Token = { id: string; code: string; days: number; note: string | null; redeemed_by: string | null; redeemed_at: string | null; created_at: string };

export function AdminTokens() {
  const [days, setDays] = useState(7);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/tokens");
    const data = await res.json();
    if (res.ok) setTokens(data.tokens ?? []);
  }
  useEffect(() => { load(); }, []);

  async function generate() {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/admin/tokens", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, note: note || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao gerar.");
      setNote("");
      await load();
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  function copy(code: string) {
    navigator.clipboard?.writeText(code);
    setCopied(code); setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div>
      <PageHeader title="Admin · Tokens de acesso" subtitle="Gere tokens que estendem o período de teste de um usuário" />

      <Card className="mb-5">
        <CardTitle>Gerar token</CardTitle>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-muted">Validade (dias)</label>
            <input type="number" min={1} max={3650} value={days} onChange={(e) => setDays(Number(e.target.value))}
              className="block mt-1 w-32 h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--card-2)] num text-sm outline-none focus:border-[var(--accent)]" />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-muted">Nota (opcional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ex: tester João"
              className="block mt-1 w-full h-10 px-3 rounded-xl border border-[var(--border)] bg-[var(--card-2)] text-sm outline-none focus:border-[var(--accent)]" />
          </div>
          <button onClick={generate} disabled={busy} className="h-10 px-5 rounded-xl font-semibold text-white disabled:opacity-50 flex items-center gap-2" style={{ background: "linear-gradient(135deg, #52528C, #D7B8F3)" }}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Ticket size={16} />} Gerar
          </button>
        </div>
        {error && <div className="flex items-center gap-2 text-sm text-danger mt-3"><AlertCircle size={15} /> {error}</div>}
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted text-xs uppercase border-b border-[var(--border)]">
              <tr><th className="text-left p-3">Código</th><th className="text-left p-3">Dias</th><th className="text-left p-3">Nota</th><th className="text-left p-3">Status</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {tokens.length === 0 && <tr><td colSpan={5} className="p-4 text-muted text-center">Nenhum token ainda.</td></tr>}
              {tokens.map((t) => (
                <tr key={t.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="p-3 num font-medium">{t.code}</td>
                  <td className="p-3 num">{t.days}</td>
                  <td className="p-3 text-muted">{t.note ?? "—"}</td>
                  <td className="p-3">{t.redeemed_by ? <Badge tone="neutral">Resgatado</Badge> : <Badge tone="positive">Disponível</Badge>}</td>
                  <td className="p-3 text-right">
                    {!t.redeemed_by && (
                      <button onClick={() => copy(t.code)} className="text-muted hover:text-[var(--accent)] inline-flex items-center gap-1 text-xs">
                        {copied === t.code ? <><Check size={13} /> copiado</> : <><Copy size={13} /> copiar</>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
