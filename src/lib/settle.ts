// Baixa de faturas e parcelas (puro, sem I/O). Só registra; o app não paga nada.
// Automática: transação de saída da conta com o MESMO valor da fatura (±R$ 0,01) ou, na parcela
// estimada, até 2% de diferença, numa janela de 10 dias antes a 5 dias depois do vencimento.
// Baixa manual (tabela debt_settlements) sempre vence; "rejected" desliga a automática.
export type Tx = { id: string; date: string; amount: number; description: string | null };
export type Settlement = { id: string; kind: "bill" | "installment" | "amortization"; target_key: string;
  transaction_id: string | null; source: "manual" | "rejected"; amount: number | null };
export type Status = { settled: boolean; source: "auto" | "manual" | null; tx: Tx | null; settlementId?: string; due: string | null; amount: number };

export const billKey = (b: { account_id: string; due_date: string | null }) => `${b.account_id}:${b.due_date}`;
export const installmentKey = (debtId: string, month: string) => `${debtId}:${month}`;

const day = 86_400_000;
const diffDays = (a: string, b: string) => Math.round((Date.parse(a) - Date.parse(b)) / day);
const inWindow = (date: string, due: string) => { const d = diffDays(date, due); return d >= -10 && d <= 5; };

function resolve(key: string, amount: number, due: string | null, txs: Tx[], manual: Settlement[], used: Set<string>,
  match: (t: Tx) => boolean): Status {
  const s = manual.find((m) => m.target_key === key);
  if (s?.source === "manual") {
    const t = txs.find((x) => x.id === s.transaction_id) ?? null;
    return { settled: true, source: "manual", tx: t, settlementId: s.id, due, amount };
  }
  if (s?.source === "rejected" || !due) return { settled: false, source: null, tx: null, settlementId: s?.id, due, amount };
  const t = txs.filter((x) => x.amount < 0 && !used.has(x.id) && inWindow(x.date, due) && match(x))
    .sort((a, b) => Math.abs(-a.amount - amount) - Math.abs(-b.amount - amount))[0];
  if (!t) return { settled: false, source: null, tx: null, due, amount };
  used.add(t.id);
  return { settled: true, source: "auto", tx: t, due, amount };
}

export function settleBills(bills: { account_id: string; due_date: string | null; total_amount: number }[], txs: Tx[], manual: Settlement[]) {
  const used = new Set(manual.map((m) => m.transaction_id).filter(Boolean) as string[]);
  const out = new Map<string, Status>();
  for (const b of bills) {
    const key = billKey(b);
    out.set(key, resolve(key, b.total_amount, b.due_date, txs, manual.filter((m) => m.kind === "bill"), used,
      (t) => Math.abs(-t.amount - b.total_amount) <= 0.01));
  }
  return out;
}

/** Parcela do mês: vencimento no mesmo dia do mês do último vencimento do contrato. */
export function settleInstallments(loans: { id: string; installment: number; due_date: string | null }[], txs: Tx[], manual: Settlement[], month: string) {
  const used = new Set(manual.map((m) => m.transaction_id).filter(Boolean) as string[]);
  const out = new Map<string, Status>();
  for (const l of loans) {
    const key = installmentKey(l.id, month);
    const [y, m] = month.split("-").map(Number);
    const dom = l.due_date ? Number(l.due_date.slice(8, 10)) : null;
    const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const due = dom ? `${month}-${String(Math.min(dom, last)).padStart(2, "0")}` : null;
    out.set(key, resolve(key, l.installment, due, txs, manual.filter((s) => s.kind === "installment"), used,
      (t) => l.installment > 0 && Math.abs(-t.amount - l.installment) / l.installment <= 0.02));
  }
  return out;
}

/** Saídas da conta perto do vencimento, da mais parecida em valor à menos; sem repetir as já usadas. */
export function candidatesFor(target: { amount: number; due: string | null }, txs: Tx[], used: Set<string>, limit = 6): Tx[] {
  return txs.filter((t) => t.amount < 0 && !used.has(t.id) && (!target.due || Math.abs(diffDays(t.date, target.due)) <= 25))
    .sort((a, b) => Math.abs(-a.amount - target.amount) - Math.abs(-b.amount - target.amount) || b.date.localeCompare(a.date))
    .slice(0, limit);
}
