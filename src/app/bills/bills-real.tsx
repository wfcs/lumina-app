"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";
import { useUI } from "@/lib/store";
import type { DbAccount, DbTransaction, CardSetting } from "@/lib/data";
import { saveCardCycle } from "./actions";
import { CreditCard, Info, Eye, ArrowRight, Settings2, Loader2, Check } from "lucide-react";

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const ddmm = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
const clampDay = (y: number, m: number, day: number) => Math.min(day, new Date(y, m + 1, 0).getDate());
const closingOn = (y: number, m: number, day: number) => new Date(y, m, clampDay(y, m, day));

function cycleFor(closingDay: number, dueDay: number) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  let end = closingOn(t.getFullYear(), t.getMonth(), closingDay);
  if (t > end) end = closingOn(t.getFullYear(), t.getMonth() + 1, closingDay);
  const prevEnd = closingOn(end.getFullYear(), end.getMonth() - 1, closingDay);
  const start = new Date(prevEnd); start.setDate(prevEnd.getDate() + 1);
  const pv = closingOn(prevEnd.getFullYear(), prevEnd.getMonth() - 1, closingDay);
  const prevStart = new Date(pv); prevStart.setDate(pv.getDate() + 1);
  let due = closingOn(end.getFullYear(), end.getMonth(), dueDay);
  if (due <= end) due = closingOn(end.getFullYear(), end.getMonth() + 1, dueDay);
  return { start, end, prevStart, prevEnd, due, today: t };
}

const instOf = (d: string | null) => {
  const m = (d ?? "").match(/(\d{1,2})\s*\/\s*(\d{1,2})\s*$/);
  return m && +m[2] > 1 ? { cur: +m[1], total: +m[2] } : null;
};
const inRange = (t: DbTransaction, a: Date, b: Date) => t.date >= iso(a) && t.date <= iso(b);

export function BillsReal({ accounts, transactions, cardSettings }: { accounts: DbAccount[]; transactions: DbTransaction[]; cardSettings: CardSetting[] }) {
  const router = useRouter();
  const { hideValues, toggleHideValues } = useUI();
  const cards = accounts.filter((a) => (a.type ?? "").toUpperCase() === "CREDIT");
  const setMap = new Map(cardSettings.map((c) => [c.account_id, c]));

  // recorrentes: descrições que aparecem em ≥2 meses (nos cartões)
  const recurringKeys = useMemo(() => {
    const norm = (d: string | null) => (d ?? "").toLowerCase().replace(/\d+/g, " ").replace(/\s+/g, " ").trim();
    const map = new Map<string, Set<string>>();
    transactions.filter((t) => cards.some((c) => c.id === t.account_id) && t.amount < 0).forEach((t) => {
      const k = norm(t.description); if (k.length < 3) return;
      if (!map.has(k)) map.set(k, new Set());
      map.get(k)!.add(t.date.slice(0, 7));
    });
    const s = new Set<string>();
    map.forEach((months, k) => { if (months.size >= 2) s.add(k); });
    return { s, norm };
  }, [transactions, cards]);
  const isRecurring = (t: DbTransaction) => recurringKeys.s.has(recurringKeys.norm(t.description));

  const per = cards.map((c) => {
    const s = setMap.get(c.id) ?? { closing_day: 1, due_day: 10 };
    const cyc = cycleFor(s.closing_day, s.due_day);
    const txs = transactions.filter((t) => t.account_id === c.id && t.amount < 0);
    const posted = txs.filter((t) => inRange(t, cyc.start, cyc.today <= cyc.end ? cyc.today : cyc.end));
    const previstas = txs.filter((t) => t.date > iso(cyc.today) && t.date <= iso(cyc.end));
    const past = txs.filter((t) => inRange(t, cyc.prevStart, cyc.prevEnd));
    const sum = (arr: DbTransaction[]) => arr.reduce((a, t) => a + Math.abs(t.amount), 0);
    return {
      acc: c, s, cyc,
      total: Math.abs(c.balance) || sum(posted),
      posted, previstas, past,
      parcelas: sum(posted.filter((t) => instOf(t.description))),
      recorrentes: sum(posted.filter((t) => isRecurring(t) && !instOf(t.description))),
      avulsas: sum(posted.filter((t) => !instOf(t.description) && !isRecurring(t))),
      prevParcelas: sum(previstas.filter((t) => instOf(t.description))),
      prevRecorrentes: sum(previstas.filter((t) => isRecurring(t))),
      pastTotal: sum(past),
      count: posted.length,
    };
  });

  const agg = per.reduce((a, p) => ({
    total: a.total + p.total, parcelas: a.parcelas + p.parcelas, recorrentes: a.recorrentes + p.recorrentes,
    avulsas: a.avulsas + p.avulsas, prevParcelas: a.prevParcelas + p.prevParcelas, prevRecorrentes: a.prevRecorrentes + p.prevRecorrentes,
  }), { total: 0, parcelas: 0, recorrentes: 0, avulsas: 0, prevParcelas: 0, prevRecorrentes: 0 });

  if (cards.length === 0) {
    return (<div><PageHeader title="Faturas" /><Card className="text-center py-14 text-muted"><CreditCard size={32} className="mx-auto mb-2 opacity-60" /><p className="text-sm">Nenhum cartão de crédito conectado.</p></Card></div>);
  }

  // range global para o Gantt
  const allDates = per.flatMap((p) => [p.cyc.prevStart, p.cyc.due]);
  const gmin = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const gmax = new Date(Math.max(...allDates.map((d) => d.getTime())));
  const span = Math.max(1, gmax.getTime() - gmin.getTime());
  const posOf = (d: Date) => `${((d.getTime() - gmin.getTime()) / span) * 100}%`;
  const widthOf = (a: Date, b: Date) => `${((b.getTime() - a.getTime()) / span) * 100}%`;

  return (
    <div className="pb-16">
      <PageHeader title="Faturas" subtitle="Cartões de crédito — ciclos, previsões e próximas faturas" />

      {/* SEÇÃO 1 — Resumo total */}
      <Card className="mb-5">
        <Money value={agg.total} className="text-4xl font-bold leading-none" />
        <p className="text-sm text-muted mt-1 mb-4">Total a pagar</p>
        <div className="border-t border-[var(--border)] pt-3 space-y-2 text-sm">
          <Row label="Parcelas" value={agg.parcelas} />
          <Row label="Recorrentes" value={agg.recorrentes} />
          <Row label="Compras avulsas" value={agg.avulsas} />
          <Row label="Parcelas previstas" value={agg.prevParcelas} prefix estimate />
          <Row label="Recorrentes previstos" value={agg.prevRecorrentes} prefix estimate />
        </div>
        <div className="flex items-start gap-2 text-[11px] text-muted mt-3">
          <span className="h-1.5 w-1.5 rounded-full bg-muted mt-1.5 shrink-0" />
          O valor total inclui parcelas e cobranças previstas. O valor final pode mudar quando a fatura fechar.
        </div>
        <div className="flex items-start gap-2 mt-3 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-2.5 text-sm">
          <Eye size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
          <span>A fatura já inclui <b><Money value={agg.prevParcelas} /></b> em parcelas previstas. Ainda faltam <b><Money value={agg.prevRecorrentes} /></b> em cobranças previstas.</span>
        </div>
      </Card>

      {/* SEÇÃO 2 — Ciclos de faturamento (Gantt) */}
      <h2 className="font-display font-bold text-lg mb-3">Ciclos de Faturamento</h2>
      <Card className="mb-5">
        <p className="text-xs text-muted mb-4">Informe o <b>fechamento</b> e o <b>vencimento</b> de cada cartão para ciclos precisos. Barra cinza = fatura passada; barra colorida = ciclo atual. Linha = hoje.</p>
        <div className="space-y-5">
          {per.map((p) => (
            <div key={p.acc.id}>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="grid place-items-center h-6 w-6 rounded-lg bg-[var(--card-2)] text-[var(--accent)]"><CreditCard size={13} /></span>
                <span className="font-semibold text-sm flex-1 truncate">{p.acc.name ?? "Cartão"}</span>
                <CycleEditor accountId={p.acc.id} closing={p.s.closing_day} due={p.s.due_day} onSaved={() => router.refresh()} />
              </div>
              <div className="relative h-9 rounded-lg bg-white/[0.03]">
                <Link href="/transactions" className="absolute top-1 h-7 rounded-md bg-white/[0.07] grid place-items-center text-[11px] text-muted hover:bg-white/[0.12]" style={{ left: posOf(p.cyc.prevStart), width: widthOf(p.cyc.prevStart, p.cyc.prevEnd) }} title="Fatura passada">
                  <span className="num truncate px-1">{hideValues ? "••" : p.pastTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </Link>
                <Link href="/transactions" className="absolute top-1 h-7 rounded-md grid place-items-center text-[11px] text-white" style={{ left: posOf(p.cyc.start), width: widthOf(p.cyc.start, p.cyc.end), background: "linear-gradient(135deg,#8332AC,#E086D3)", opacity: 0.9 }} title="Ciclo atual">
                  <span className="num truncate px-1">{hideValues ? "••" : p.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                </Link>
                <div className="absolute top-0 h-full w-0.5 bg-[var(--mint)]" style={{ left: posOf(p.cyc.today) }} title="Hoje" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted mt-2 num">
          <span>{ddmm(gmin)}</span><span>{ddmm(gmax)}</span>
        </div>
      </Card>

      {/* SEÇÃO 3 — Próximas faturas */}
      <h2 className="font-display font-bold text-lg mb-3">Próximas Faturas</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        {per.map((p) => {
          const days = Math.round((p.cyc.due.getTime() - p.cyc.today.getTime()) / 86400000);
          const prog = Math.min(100, Math.max(0, ((p.cyc.today.getTime() - p.cyc.start.getTime()) / Math.max(1, p.cyc.end.getTime() - p.cyc.start.getTime())) * 100));
          return (
            <Card key={p.acc.id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="grid place-items-center h-8 w-8 rounded-full bg-[var(--card-2)] text-[var(--accent)]"><CreditCard size={16} /></span>
                <span className="font-semibold text-sm flex-1 truncate">{p.acc.name ?? "Cartão"}</span>
                <Badge tone="positive">Ciclo atual</Badge>
                <Money value={p.total} className="font-bold" />
              </div>
              <div className="flex justify-between text-xs text-muted"><span>Venc: {ddmm(p.cyc.due)}</span><span>{p.count} compras</span></div>
              <div className={`text-xs mt-1 ${days <= 3 ? "text-warn" : "text-muted"}`}>Vence em {days} dias</div>
              <div className="text-[11px] text-muted">Fecha {ddmm(p.cyc.end)} · Venc: {ddmm(p.cyc.due)}</div>
              <p className="text-[11px] text-muted italic mt-1">Baseado nas transações do ciclo atual.</p>
              <div className="mt-2 flex items-center gap-2 text-[10px] text-muted num"><span>{ddmm(p.cyc.start)}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${prog}%`, background: "linear-gradient(90deg,#8332AC,#E086D3)" }} /></div>
                <span>{ddmm(p.cyc.end)}</span></div>
              {p.prevParcelas + p.prevRecorrentes > 0 && <p className="text-[11px] text-muted italic mt-1">+<Money value={p.prevParcelas + p.prevRecorrentes} /> previsto</p>}
              <div className="mt-3 pt-2 border-t border-[var(--border)]">
                <p className="text-[10px] uppercase tracking-wide text-muted mb-1">Por cartão</p>
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard size={13} className="text-muted" />
                  <span className="flex-1">Final {p.acc.number?.slice(-4) ?? "----"} <span className="text-muted text-xs">· {p.count} transações</span></span>
                  <Money value={p.total} className="font-medium" />
                </div>
              </div>
              <Link href="/transactions" className="text-[var(--accent)] text-xs font-semibold flex items-center gap-1 mt-3">Ver transações <ArrowRight size={12} /></Link>
            </Card>
          );
        })}
      </div>

      {/* SEÇÃO 4 — Recentemente pagas */}
      <h2 className="font-display font-bold text-lg mb-3">Recentemente Pagas</h2>
      <Card className="text-center py-8 text-muted text-sm">
        Faturas pagas confirmadas pelo banco ainda não são sincronizadas. Chega quando ligarmos o produto de faturas do Open Finance.
      </Card>

      {/* FAB — ocultar/mostrar valores */}
      <button onClick={toggleHideValues} title={hideValues ? "Mostrar valores" : "Ocultar valores"}
        className="fixed bottom-20 right-5 z-30 h-12 w-12 rounded-full grid place-items-center text-white shadow-glow-violet"
        style={{ background: "linear-gradient(135deg,#8332AC,#E086D3)" }}>
        <Eye size={20} />
      </button>
    </div>
  );
}

function Row({ label, value, prefix, estimate }: { label: string; value: number; prefix?: boolean; estimate?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={estimate ? "text-muted" : ""}>{label}</span>
      <span className={estimate ? "text-muted" : "font-medium"}>{prefix ? "~ " : ""}<Money value={value} /></span>
    </div>
  );
}

function CycleEditor({ accountId, closing, due, onSaved }: { accountId: string; closing: number; due: number; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [c, setC] = useState(closing);
  const [d, setD] = useState(due);
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    const res = await saveCardCycle(accountId, c, d);
    setBusy(false);
    if (!res.error) { setOpen(false); onSaved(); }
  }
  if (!open) return <button onClick={() => setOpen(true)} className="text-xs text-muted hover:text-[var(--accent)] inline-flex items-center gap-1"><Settings2 size={13} /> Fecha {closing} · Venc {due}</button>;
  return (
    <div className="flex items-center gap-1.5">
      <label className="text-[11px] text-muted">Fecha</label>
      <input type="number" min={1} max={31} value={c} onChange={(e) => setC(+e.target.value)} className="w-12 h-7 px-1 text-center rounded-lg border border-[var(--border)] bg-[var(--card-2)] text-xs num" />
      <label className="text-[11px] text-muted">Venc</label>
      <input type="number" min={1} max={31} value={d} onChange={(e) => setD(+e.target.value)} className="w-12 h-7 px-1 text-center rounded-lg border border-[var(--border)] bg-[var(--card-2)] text-xs num" />
      <button onClick={save} disabled={busy} className="grid place-items-center h-7 w-7 rounded-lg text-white" style={{ background: "linear-gradient(135deg,#8332AC,#E086D3)" }}>{busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={13} />}</button>
    </div>
  );
}
