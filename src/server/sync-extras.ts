// Grava investimentos, dívidas e faturas de cartão vindos do Open Finance.
import { mapBill, mapInvestment, mapLoan } from "./mappers";

type DB = any; // SupabaseClient com sessão do usuário

export interface ExtrasInput {
  investments: any[];
  loans: any[];
  bills: { accountId: string; bill: any }[];
}

export async function saveExtras(supabase: DB, userId: string, connectionId: string, input: ExtrasInput) {
  const now = new Date().toISOString();

  const inv = input.investments.map((i) => ({ ...mapInvestment(i), user_id: userId, connection_id: connectionId, updated_at: now }));
  const debts = input.loans.map((l) => ({ ...mapLoan(l), user_id: userId, connection_id: connectionId, updated_at: now }));
  const bills = input.bills
    .map(({ accountId, bill }) => ({ ...mapBill(bill), user_id: userId, account_id: accountId, updated_at: now }))
    .filter((b) => b.reference_month);

  // Cada tabela é gravada de forma independente: erro numa não impede as outras.
  const errors: string[] = [];
  const write = async (table: string, rows: any[], onConflict: string) => {
    if (!rows.length) return;
    const { error } = await supabase.from(table).upsert(rows, { onConflict });
    if (error) errors.push(`${table}: ${error.message ?? String(error)}`);
  };
  await write("investments", inv, "provider_id");
  await write("debts", debts, "provider_id");
  await write("card_bills", bills, "provider_bill_id");

  return { investments: inv.length, debts: debts.length, bills: bills.length, ...(errors.length ? { errors } : {}) };
}
