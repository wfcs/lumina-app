"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";

export default function ImportPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ account: string; transactions: number } | null>(null);

  async function upload() {
    if (!file) return;
    setStatus("uploading");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao importar.");
      setResult({ account: data.account, transactions: data.transactions });
      setStatus("done");
      setTimeout(() => { router.replace("/"); router.refresh(); }, 1600);
    } catch (e: any) {
      setStatus("idle");
      setError(e.message ?? "Erro ao importar o arquivo.");
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 relative overflow-hidden">
      <div className="orb h-72 w-72 -top-10 right-0" style={{ background: "radial-gradient(circle, #4FCE9A, transparent 70%)" }} />
      <div className="relative w-full max-w-md">
        <Link />
        <div className="card p-6">
          <div className="h-12 w-12 rounded-2xl grid place-items-center mb-4 border border-[var(--mint)]/30 bg-[var(--mint)]/10">
            <FileUp size={22} className="text-[var(--mint)]" />
          </div>
          <h1 className="font-display text-xl font-bold">Importar extrato</h1>
          <p className="text-sm text-muted mt-1 mb-5">
            No app/site do seu banco, exporte o extrato em <b>OFX</b> ou <b>CSV</b> e selecione o arquivo abaixo.
          </p>

          {status === "done" && result ? (
            <div className="py-8 text-center">
              <CheckCircle2 size={36} className="mx-auto text-[var(--mint)] mb-2" />
              <p className="font-semibold">{result.transactions} transações importadas!</p>
              <p className="text-sm text-muted">Levando você ao painel…</p>
            </div>
          ) : (
            <>
              <input
                ref={inputRef}
                type="file"
                accept=".ofx,.csv,text/csv,application/x-ofx"
                className="hidden"
                onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null); }}
              />
              <button
                onClick={() => inputRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-[var(--border)] hover:border-[var(--mint)]/50 bg-[var(--card-2)] p-6 text-center transition-colors"
              >
                <FileUp size={22} className="mx-auto text-muted mb-2" />
                <span className="text-sm font-medium block truncate">{file ? file.name : "Selecionar arquivo OFX ou CSV"}</span>
                <span className="text-xs text-muted">{file ? "Clique para trocar" : ".ofx ou .csv"}</span>
              </button>

              {error && (
                <div className="flex items-start gap-2 text-sm text-danger mt-3 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" /> {error}
                </div>
              )}

              <button
                onClick={upload}
                disabled={!file || status === "uploading"}
                className="w-full h-12 mt-4 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #52528C, #D7B8F3)" }}
              >
                {status === "uploading" ? <><Loader2 size={18} className="animate-spin" /> Importando…</> : "Importar"}
              </button>
              <p className="text-[11px] text-muted mt-3 text-center">CSV esperado: colunas de data, descrição e valor.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Link() {
  return (
    <a href="/connect" className="inline-flex items-center gap-1 text-xs text-muted hover:text-[var(--text)] mb-3">
      <ArrowLeft size={13} /> Voltar para as opções
    </a>
  );
}
