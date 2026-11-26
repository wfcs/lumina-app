"use client";
// Baixa de dívidas: aponta qual transação pagou a fatura, a parcela ou a amortização.
// Só registra (POST/DELETE /api/settlements); o Lumina não faz pagamentos.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Search, Undo2 } from "lucide-react";
import { useUI } from "@/lib/store";
import type { Status, Tx } from "@/lib/settle";

export type SettleView = Status & { kind: "bill" | "installment"; key: string; candidates: Tx[] };
export type AmortView = { done: { id: string; tx: Tx | null; amount: number }[]; candidates: Tx[] };

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dm = (iso: string) => iso.slice(8, 10) + "/" + iso.slice(5, 7);

async function send(method: "POST" | "DELETE", body?: object, id?: string) {
  const res = await fetch(`/api/settlements${id ? `?id=${id}` : ""}`, {
    method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined,
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.error ?? "Não foi possível salvar.");
}

function useRun(onDone: () => void) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true); setErr(null);
    try { await fn(); onDone(); router.refresh(); } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };
  return { busy, err, run };
}

function TxPicker({ suggested, all, onPick, busy }: { suggested: Tx[]; all: Tx[]; onPick: (t: Tx) => void; busy: boolean }) {
  const hide = useUI((s) => s.hideValues);
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const list = term
    ? all.filter((t) => (t.description ?? "").toLowerCase().includes(term) || brl(-t.amount).includes(term)).slice(0, 8)
    : suggested;
  return (
    <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--card-2)] p-2">
      <div className="text-xs text-muted px-1 mb-1.5">Escolha a transação que pagou</div>
      <ul className="space-y-1">
        {list.length === 0 && <li className="text-xs text-muted px-1 py-2">Nenhuma saída encontrada.</li>}
        {list.map((t, i) => (
          <li key={t.id}>
            <button disabled={busy} onClick={() => onPick(t)}
              className={`w-full flex items-center justify-between gap-3 text-left text-sm rounded-lg px-2.5 min-h-[44px] border transition-colors disabled:opacity-50 ${i === 0 && !term ? "border-[var(--accent)]/50 bg-[var(--accent)]/10" : "border-transparent hover:bg-[var(--card)]"}`}>
              <span className="truncate">{dm(t.date)} · {t.description ?? "—"}</span>
              <span className="num shrink-0 font-semibold">
                {hide ? "••••" : brl(t.amount)}
                {i === 0 && !term && <span className="text-xs text-[var(--accent)] font-normal ml-1.5">sugerida</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <label className="flex items-center gap-2 mt-2 px-2 h-10 rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <Search size={14} className="text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar outra transação"
          aria-label="Buscar outra transação" className="flex-1 bg-transparent text-sm outline-none" />
      </label>
    </div>
  );
}

/** Situação de uma fatura ou parcela: baixada (com a transação) ou botão "Dar baixa". */
export function SettleLine({ v, all, label }: { v: SettleView; all: Tx[]; label?: string }) {
  const hide = useUI((s) => s.hideValues);
  const [open, setOpen] = useState(false);
  const { busy, err, run } = useRun(() => setOpen(false));
  const pick = (t: Tx) => run(() => send("POST", { kind: v.kind, target_key: v.key, transaction_id: t.id }));
  const undo = () => run(() => (v.source === "manual" && v.settlementId
    ? send("DELETE", undefined, v.settlementId)
    : send("POST", { kind: v.kind, target_key: v.key, source: "rejected" })));
  const prefix = label ? `${label}: ` : "";

  if (v.settled) {
    const what = v.tx ? `${v.tx.description ?? "transação"} de ${dm(v.tx.date)}, ${hide ? "••••" : brl(-v.tx.amount)}` : "transação não encontrada";
    return (
      <div className="flex items-center justify-between gap-3 text-xs mt-1">
        <span className="text-[var(--mint)] flex items-center gap-1.5 min-w-0">
          <Check size={13} className="shrink-0" />
          <span className="truncate">{prefix}baixada · {what}{v.source === "auto" ? " (encontrada automaticamente)" : ""}</span>
        </span>
        <button onClick={undo} disabled={busy} className="text-muted hover:text-[var(--text)] inline-flex items-center gap-1 min-h-[44px] px-2 -mr-2 shrink-0">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Undo2 size={13} />} {v.source === "auto" ? "Não é esta" : "Desfazer"}
        </button>
      </div>
    );
  }
  return (
    <div className="mt-1">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted">{prefix}sem pagamento identificado{v.due ? ` (vence ${dm(v.due)})` : ""}</span>
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
          className="inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-full text-xs font-semibold shrink-0"
          style={{ background: "var(--accent-fill)", color: "var(--on-accent)" }}>{open ? "Fechar" : "Dar baixa"}</button>
      </div>
      {open && <TxPicker suggested={v.candidates} all={all} onPick={pick} busy={busy} />}
      {err && <p className="text-xs text-danger mt-1" role="alert">{err}</p>}
    </div>
  );
}

/** Registrar pagamento extra (amortização) num contrato, apontando a transação. */
export function AmortizeBox({ debtId, v, all }: { debtId: string; v: AmortView; all: Tx[] }) {
  const hide = useUI((s) => s.hideValues);
  const [open, setOpen] = useState(false);
  const { busy, err, run } = useRun(() => setOpen(false));
  return (
    <div className="mt-2">
      {v.done.map((d) => (
        <div key={d.id} className="flex items-center justify-between gap-3 text-xs">
          <span className="text-[var(--mint)] flex items-center gap-1.5 min-w-0">
            <Check size={13} className="shrink-0" />
            <span className="truncate">Amortização registrada · {d.tx ? `${d.tx.description ?? "transação"} de ${dm(d.tx.date)}` : "transação"}, {hide ? "••••" : brl(d.amount)}</span>
          </span>
          <button onClick={() => run(() => send("DELETE", undefined, d.id))} disabled={busy}
            className="text-muted hover:text-[var(--text)] inline-flex items-center gap-1 min-h-[44px] px-2 -mr-2 shrink-0"><Undo2 size={13} /> Desfazer</button>
        </div>
      ))}
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="inline-flex items-center gap-1.5 px-3 min-h-[36px] rounded-full text-xs font-semibold border border-[var(--accent)] text-[var(--accent)] mt-1">
        {open ? "Fechar" : "Registrar amortização"}
      </button>
      {open && <TxPicker suggested={v.candidates} all={all} busy={busy}
        onPick={(t) => run(() => send("POST", { kind: "amortization", target_key: debtId, transaction_id: t.id }))} />}
      {err && <p className="text-xs text-danger mt-1" role="alert">{err}</p>}
      {open && <p className="text-xs text-muted mt-1">O saldo devedor oficial vem do banco e muda no próximo sync, depois que o banco processar o pagamento.</p>}
    </div>
  );
}
