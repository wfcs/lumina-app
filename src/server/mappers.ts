// Mapeadores puros: payload Open Finance (Pluggy ou Banco MCP) → linhas das tabelas
// da Fase 0. Defensivos: aceitam camelCase (Pluggy) e snake_case (Banco MCP).

type Raw = Record<string, any>;

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const day = (v: unknown): string | null => (typeof v === "string" && v.length >= 10 ? v.slice(0, 10) : null);
const snake = (v: unknown): string => String(v ?? "other").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_") || "other";

/** Parcela "n/N" ao final da descrição (ex.: "Loja 3/6"). Evita datas como "10/11 Fulano". */
function installmentFromText(desc: string): [number, number] | null {
  const m = /(?:^|\s)(\d{1,2})\/(\d{1,2})\s*$/.exec(desc);
  if (!m) return null;
  const n = Number(m[1]), total = Number(m[2]);
  return total >= 2 && n >= 1 && n <= total ? [n, total] : null;
}

export function txExtras(t: Raw) {
  const meta = t.creditCardMetadata ?? t.credit_card_metadata ?? {};
  let n = num(meta.installmentNumber ?? t.installmentNumber ?? t.installment_number);
  let total = num(meta.totalInstallments ?? t.totalInstallments ?? t.total_installments);
  if (!(n && total && total >= 2 && n >= 1 && n <= total)) {
    const parsed = installmentFromText(String(t.description ?? ""));
    [n, total] = parsed ?? [null, null];
  }
  return {
    installment_number: n,
    installment_total: total,
    original_description: t.descriptionRaw ?? t.description_raw ?? null,
  };
}

export function mapInvestment(i: Raw) {
  return {
    provider_id: String(i.id ?? i.investment_id),
    name: i.name ?? i.productName ?? i.product_name ?? "Investimento",
    type: snake(i.type),
    subtype: i.subtype ?? null,
    balance: num(i.balance ?? i.amount ?? i.value) ?? 0,
    indexer: i.rateType ?? i.rate_type ?? null,
    rate: num(i.rate),
    due_date: day(i.dueDate ?? i.due_date),
    source: "openfinance" as const,
  };
}

export function mapLoan(l: Raw) {
  const inst = l.installments ?? {};
  const rate = Array.isArray(l.interestRates) ? l.interestRates[0]?.preFixedRate : l.rate ?? l.interest_rate;
  return {
    provider_id: String(l.id ?? l.loan_id),
    // Contrato citado só pelos 3 dígitos finais (privacidade).
    name: [l.productName ?? l.product_name ?? l.name ?? "Empréstimo",
      l.contractNumber ? `…${String(l.contractNumber).slice(-3)}` : null].filter(Boolean).join(" "),
    type: snake(l.type),
    outstanding_balance: Math.max(0, num(
      l.payments?.contractOutstandingBalance ?? l.outstandingBalance ?? l.outstanding_balance
      ?? l.totalRemainingAmount ?? l.balance) ?? 0),
    installment_amount: num(l.nextInstallmentAmount ?? l.installmentAmount ?? l.installment_amount),
    installments_total: num(inst.totalNumberOfInstallments ?? l.installments_total),
    installments_paid: num(inst.paidInstallments ?? l.installments_paid),
    rate: num(rate),
    due_date: day(l.dueDate ?? l.due_date),
    source: "openfinance" as const,
  };
}

export function mapBill(b: Raw) {
  const due = day(b.dueDate ?? b.due_date);
  return {
    provider_bill_id: String(b.id ?? b.bill_id),
    due_date: due,
    reference_month: due ? `${due.slice(0, 7)}-01` : null,
    total_amount: num(b.totalAmount ?? b.total_amount) ?? 0,
    minimum_payment: num(b.minimumPaymentAmount ?? b.minimum_payment_amount),
    ...(billStatus(b.payment_status) ? { status: billStatus(b.payment_status) } : {}),
    ...(day(b.billClosingDate ?? b.closing_date) ? { closing_date: day(b.billClosingDate ?? b.closing_date) } : {}),
  };
}

/** payment_status derivado pelo Banco MCP → domínio de card_bills.status.
 *  PAST_DUE_UNCONFIRMED vira "closed": o pagamento pode ter sido feito e ainda não refletido. */
export function billStatus(s: unknown): "open" | "closed" | "paid" | "overdue" | undefined {
  switch (s) {
    case "PAID": return "paid";
    case "OPEN": return "open";
    case "PAST_DUE_UNPAID": return "overdue";
    case "PAST_DUE_UNCONFIRMED": return "closed";
    default: return undefined;
  }
}

/** /loans/list do Banco MCP agrupa por conexão ({ results: [{ item, results: [...] }] }). Achata. */
export function flattenLoans(r: any): Raw[] {
  const top: any[] = Array.isArray(r) ? r : (r?.loans ?? r?.results ?? []);
  const flat = top.flatMap((x) => (Array.isArray(x?.results) && x?.id === undefined ? x.results : [x]));
  return flat.filter((l) => l && (l.id ?? l.loan_id));
}
