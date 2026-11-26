// Rótulos legíveis para códigos que vêm do Open Finance.

const ACCOUNT_TYPES: Record<string, string> = {
  CHECKING_ACCOUNT: "Conta corrente",
  SAVINGS_ACCOUNT: "Poupança",
  PAYMENT_ACCOUNT: "Conta de pagamento",
  CREDIT_CARD: "Cartão de crédito",
  BANK: "Conta bancária",
  CREDIT: "Cartão de crédito",
};
/** "CHECKING_ACCOUNT" → "Conta corrente"; código desconhecido vira texto legível. */
export function accountTypeLabel(subtype: string | null | undefined, type?: string | null): string {
  const code = (subtype ?? type ?? "").toUpperCase();
  if (!code) return "";
  return ACCOUNT_TYPES[code] ?? code.toLowerCase().replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

/** "CREDITO ECONSIGNADO REFIN ITAU …374" → "Consignado Itaú …374" (o banco manda em caixa alta). */
export function loanLabel(name: string): string {
  const suf = /…\d+$/.exec(name)?.[0];
  const raw = name.replace(/…\d+$/, "").trim();
  const base = raw.toUpperCase();
  const kind = /CONSIGNADO/.test(base) ? "Consignado" : /PESSOAL/.test(base) ? "Pessoal"
    : /IMOBILI|HABITA/.test(base) ? "Imobiliário" : /VE[IÍ]CULO|AUTO/.test(base) ? "Veículo" : null;
  const bank = /ITAU|ITAÚ/.test(base) ? "Itaú" : /NUBANK|NU /.test(base) ? "Nubank" : null;
  const label = kind ? [kind, bank].filter(Boolean).join(" ") : raw.toLowerCase().replace(/^./, (c) => c.toUpperCase());
  return suf ? `${label} ${suf}` : label;
}
