// Resumo de um mês (puro, sem I/O): entradas, saídas e saldo.
// Pagamento de fatura move dinheiro entre as suas próprias contas (sai da conta, entra no cartão):
// não é receita nem despesa, então fica fora dos dois lados e aparece à parte em `internal`.
type Tx = { account_id: string; date: string; amount: number; description: string | null };

export function isCardPayment(t: Tx, accountType: string | null | undefined): boolean {
  const d = (t.description ?? "").trim().toLowerCase();
  const credit = (accountType ?? "").toUpperCase() === "CREDIT";
  if (credit) return t.amount > 0 && /^(pagamento recebido|pagamento com saldo)/.test(d);
  return t.amount < 0 && /^pagamento de fatura/.test(d);
}

export function monthSummary(txs: Tx[], typeByAccount: Map<string, string | null>, month: string) {
  let income = 0, expense = 0, internal = 0, count = 0;
  for (const t of txs) {
    if (!t.date.startsWith(month)) continue;
    if (isCardPayment(t, typeByAccount.get(t.account_id))) { if (t.amount > 0) internal += t.amount; continue; }
    count++;
    if (t.amount > 0) income += t.amount; else expense += -t.amount;
  }
  return { month, income, expense, net: income - expense, internal, count };
}

/** Meses com movimento até `current` (parcelas futuras ficam de fora), do mais recente ao mais antigo. */
export function monthsAvailable(txs: { date: string }[], current: string): string[] {
  return Array.from(new Set(txs.map((t) => t.date.slice(0, 7)))).filter((m) => m <= current).sort().reverse();
}
