// Plano de pagamento de dívidas (puro, sem I/O): KPIs + ordem recomendada.
// Regra: 1) faturas de cartão vencidas sem pagamento visível (rotativo é o crédito mais caro
// e a taxa do cartão não vem no Open Finance); 2) faturas abertas: pagar o total no vencimento;
// 3) empréstimos por maior taxa mensal (avalanche); empate → menor saldo.
// Recomendação apenas: o app não executa pagamentos.

export interface LoanIn {
  id: string; name: string; outstanding_balance: number; rate: number | null;
  installments_total: number | null; installments_paid: number | null;
  installment_amount: number | null; due_date: string | null;
}
export interface CardIn { id: string; institution: string; used: number; limit: number | null }
export interface BillIn { account_id: string; due_date: string | null; total_amount: number; status: string }

export interface LoanOut extends LoanIn {
  remaining: number; installment: number; installmentEstimated: boolean;
  monthlyInterest: number; paidShare: number;
}
export interface CardOut extends CardIn { utilization: number | null; alert: boolean; lastBill: BillIn | null }
export type RankItem =
  | { kind: "bills"; action: "confirmar" | "pagar_total"; bills: (BillIn & { institution: string })[]; total: number }
  | { kind: "loan"; action: "amortizar" | "em_dia"; loanId: string; name: string; rate: number;
      balance: number; interestShare: number; savingPer1000: number };

export const CARD_ALERT = 0.8; // uso do limite acima disso ganha cor de alerta

/** Tabela Price: PMT = PV·i / (1 − (1+i)^−n). */
export function pricePmt(pv: number, i: number, n: number): number {
  if (n <= 0 || pv <= 0) return 0;
  if (!i) return pv / n;
  return (pv * i) / (1 - Math.pow(1 + i, -n));
}

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

/** Chave de uma fatura (cartão + vencimento): a mesma usada nas baixas (src/lib/settle.ts). */
const billKeyOf = (b: BillIn) => `${b.account_id}:${b.due_date}`;

export function buildDebtPlan(input: { loans: LoanIn[]; cards: CardIn[]; bills: BillIn[]; today: string; settledBills?: Set<string> }) {
  const { today } = input;

  const all = input.loans.map((l): LoanOut => {
    const total = l.installments_total ?? 0;
    const remaining = Math.max(0, total - (l.installments_paid ?? 0));
    const rate = l.rate ?? 0;
    const informed = (l.installment_amount ?? 0) > 0;
    return {
      ...l, remaining,
      installment: informed ? Number(l.installment_amount) : pricePmt(l.outstanding_balance, rate, remaining),
      installmentEstimated: !informed,
      monthlyInterest: l.outstanding_balance * rate,
      paidShare: total > 0 ? (l.installments_paid ?? 0) / total : 0,
    };
  });
  const activeLoans = all
    .filter((l) => l.outstanding_balance > 0)
    .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0) || a.outstanding_balance - b.outstanding_balance);
  const paidOffLoans = all.filter((l) => l.outstanding_balance <= 0);

  // Só a fatura mais recente de cada cartão importa para "o que pagar agora".
  const latest = new Map<string, BillIn>();
  for (const b of input.bills) {
    const cur = latest.get(b.account_id);
    if (!cur || String(b.due_date) > String(cur.due_date)) latest.set(b.account_id, b);
  }
  const cards: CardOut[] = input.cards.map((c) => {
    const utilization = c.limit && c.limit > 0 ? c.used / c.limit : null;
    return { ...c, utilization, alert: (utilization ?? 0) > CARD_ALERT, lastBill: latest.get(c.id) ?? null };
  });
  const inst = new Map(input.cards.map((c) => [c.id, c.institution]));
  // Fatura com baixa (transação que a pagou) sai da lista do que pagar.
  const settled = input.settledBills ?? new Set<string>();
  const withInst = (b: BillIn) => ({ ...b, institution: inst.get(b.account_id) ?? "Cartão" });
  const open = Array.from(latest.values()).filter((b) => b.status !== "paid" && b.total_amount > 0);
  const pending = open.filter((b) => !settled.has(billKeyOf(b))).map(withInst);
  const settledBills = open.filter((b) => settled.has(billKeyOf(b))).map(withInst);
  const toConfirm = pending.filter((b) => (b.status === "closed" || b.status === "overdue") && b.due_date && b.due_date <= today);
  const toPay = pending.filter((b) => !toConfirm.includes(b));

  const monthlyInterest = sum(activeLoans.map((l) => l.monthlyInterest));
  const ranking: RankItem[] = [];
  if (toConfirm.length) ranking.push({ kind: "bills", action: "confirmar", bills: toConfirm, total: sum(toConfirm.map((b) => b.total_amount)) });
  if (toPay.length) ranking.push({ kind: "bills", action: "pagar_total", bills: toPay, total: sum(toPay.map((b) => b.total_amount)) });
  activeLoans.forEach((l, idx) => ranking.push({
    kind: "loan", action: idx === 0 ? "amortizar" : "em_dia", loanId: l.id, name: l.name,
    rate: l.rate ?? 0, balance: l.outstanding_balance,
    interestShare: monthlyInterest > 0 ? l.monthlyInterest / monthlyInterest : 0,
    savingPer1000: 1000 * (l.rate ?? 0),
  }));

  const loanBalance = sum(activeLoans.map((l) => l.outstanding_balance));
  const billsToConfirm = sum(toConfirm.map((b) => b.total_amount));
  const dues = activeLoans.map((l) => l.due_date).filter(Boolean) as string[];
  return {
    kpis: {
      loanBalance, billsToConfirm, billsToConfirmCount: toConfirm.length,
      billsToPay: sum(toPay.map((b) => b.total_amount)),
      // Total devido = saldo dos empréstimos + faturas fechadas não pagas.
      // Não soma o "limite usado" do cartão para não contar a mesma compra duas vezes.
      totalOwed: loanBalance + billsToConfirm,
      monthlyInterest,
      avgRate: loanBalance > 0 ? monthlyInterest / loanBalance : 0, // ponderado pelo saldo
      monthlyInstallments: sum(activeLoans.map((l) => l.installment)),
      lastDueDate: dues.sort().at(-1) ?? null,
    },
    ranking, activeLoans, paidOffLoans, cards, settledBills,
  };
}
export type DebtPlan = ReturnType<typeof buildDebtPlan>;
