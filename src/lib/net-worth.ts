// Patrimônio líquido (puro, sem I/O).
// net = (saldo das contas + investimentos) − (cartões usados + saldo devedor dos empréstimos)
// Antes só entravam contas e cartões; empréstimos e investimentos ficavam de fora.
const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
const isCredit = (t: string | null | undefined) => (t ?? "").toUpperCase() === "CREDIT";

export function netWorth(input: {
  accounts: { type: string | null; balance: number }[];
  investments: { balance: number }[];
  loans: { outstanding_balance: number }[];
}) {
  const cash = sum(input.accounts.filter((a) => !isCredit(a.type)).map((a) => a.balance));
  const cards = sum(input.accounts.filter((a) => isCredit(a.type)).map((a) => Math.abs(a.balance)));
  const investments = sum(input.investments.map((i) => i.balance));
  const loans = sum(input.loans.map((l) => Math.max(0, l.outstanding_balance)));
  const assets = cash + investments;
  const debts = cards + loans;
  return { cash, investments, assets, cards, loans, debts, net: assets - debts };
}
export type NetWorth = ReturnType<typeof netWorth>;
