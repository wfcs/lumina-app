import { getAccounts, getConnections, getDebts, getCardBills, hasConnection, getSettlements, getBankTransactions } from "@/lib/data";
import { buildDebtPlan } from "@/lib/debt-plan";
import { settleBills, settleInstallments, candidatesFor, billKey, installmentKey, type Status, type Tx } from "@/lib/settle";
import { DebtsReal } from "./debts-real";
import type { SettleView } from "./settle-ui";

export default async function DebtsPage() {
  const connected = await hasConnection();
  const [accounts, connections, debts, bills, settlements, bank] = connected
    ? await Promise.all([getAccounts(), getConnections(), getDebts(), getCardBills(), getSettlements(), getBankTransactions(120)])
    : [[], [], [], [], [], []];
  const instById = new Map(connections.map((c) => [c.id, c.institution_name ?? "Cartão"]));
  const cards = accounts
    .filter((a) => (a.type ?? "").toUpperCase() === "CREDIT")
    .map((a) => ({ id: a.id, institution: instById.get(a.connection_id) ?? a.name ?? "Cartão",
      used: Math.abs(Number(a.balance)), limit: a.credit_limit == null ? null : Number(a.credit_limit) }));
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const month = today.slice(0, 7);

  // Baixas: faturas em aberto e parcela do mês de cada contrato ativo.
  const billStatus = settleBills(bills.filter((b) => b.status !== "paid" && b.total_amount > 0), bank, settlements);
  const settledBills = new Set(Array.from(billStatus.entries()).filter(([, s]) => s.settled).map(([k]) => k));
  const plan = buildDebtPlan({ loans: debts, cards, bills, today, settledBills });
  const instStatus = settleInstallments(plan.activeLoans.map((l) => ({ id: l.id, installment: l.installment, due_date: l.due_date })), bank, settlements, month);

  const used = new Set<string>([...settlements.map((s) => s.transaction_id).filter(Boolean) as string[],
    ...[...Array.from(billStatus.values()), ...Array.from(instStatus.values())].map((s) => s.tx?.id).filter(Boolean) as string[]]);
  const view = (kind: "bill" | "installment", key: string, s: Status): SettleView =>
    ({ kind, key, ...s, candidates: s.settled ? [] : candidatesFor({ amount: s.amount, due: s.due }, bank, used) });
  const byId = new Map(bank.map((t) => [t.id, t]));
  const settle = {
    bills: Object.fromEntries([...plan.settledBills, ...plan.ranking.flatMap((r) => (r.kind === "bills" ? r.bills : []))]
      .map((b) => [billKey(b), view("bill", billKey(b), billStatus.get(billKey(b))!)])),
    installments: Object.fromEntries(plan.activeLoans.map((l) => [l.id, view("installment", installmentKey(l.id, month), instStatus.get(installmentKey(l.id, month))!)])),
    amortizations: Object.fromEntries(plan.activeLoans.map((l) => [l.id, {
      done: settlements.filter((s) => s.kind === "amortization" && s.target_key === l.id)
        .map((s) => ({ id: s.id, tx: byId.get(s.transaction_id ?? "") ?? null, amount: s.amount ?? 0 })),
      // Amortização é pagamento extra: sugere as maiores saídas recentes ainda sem baixa.
      candidates: bank.filter((t) => t.amount < 0 && !used.has(t.id)).sort((x, y) => x.amount - y.amount).slice(0, 6) as Tx[],
    }])),
    // Busca livre no seletor: todas as saídas dos últimos 120 dias ainda sem baixa.
    allOut: bank.filter((t) => t.amount < 0 && !used.has(t.id)) as Tx[],
    monthLabel: new Date(`${month}-15T12:00:00`).toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
  };
  const syncs = connections.filter((c) => c.status !== "disconnected").map((c) => c.last_sync_at).filter(Boolean) as string[];
  const asOf = syncs.sort().at(-1) ?? null;
  const banks = Array.from(new Set(connections.filter((c) => c.status !== "disconnected").map((c) => c.institution_name).filter(Boolean))) as string[];
  return <DebtsReal plan={plan} asOf={asOf} banks={banks} settle={settle} />;
}
