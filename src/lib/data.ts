import { createClient } from "@/lib/supabase/server";
import { activeAccounts } from "./active-accounts";

export interface DbAccount {
  id: string; connection_id: string; type: string | null; subtype: string | null;
  name: string | null; number: string | null; balance: number; credit_limit: number | null; currency: string;
}
export interface DbConnection {
  id: string; institution_name: string | null; institution_image: string | null;
  status: string; last_sync_at: string | null;
}
export interface DbTransaction {
  id: string; account_id: string; description: string | null; amount: number;
  type: string | null; date: string; category: string | null; category_id: string | null;
}

export async function hasConnection(): Promise<boolean> {
  const supabase = createClient();
  const { count } = await supabase
    .from("connections")
    .select("id", { count: "exact", head: true });
  return (count ?? 0) > 0;
}

export async function getConnections(): Promise<DbConnection[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("connections")
    .select("id, institution_name, institution_image, status, last_sync_at")
    .order("created_at");
  return data ?? [];
}

export async function getAccounts(): Promise<DbAccount[]> {
  const supabase = createClient();
  const [{ data }, { data: conns }] = await Promise.all([
    supabase.from("accounts").select("id, connection_id, type, subtype, name, number, balance, credit_limit, currency"),
    supabase.from("connections").select("id, status"),
  ]);
  return activeAccounts(data ?? [], conns ?? []);
}

export async function getTransactions(limit = 200): Promise<DbTransaction[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("transactions")
    .select("id, account_id, description, amount, type, date, category, category_id")
    .order("date", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export interface UserCategory {
  id: string; parent_id: string | null; name: string; emoji: string | null; is_default: boolean;
}
export async function getUserCategories(): Promise<UserCategory[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("user_categories")
    .select("id, parent_id, name, emoji, is_default")
    .order("created_at");
  return data ?? [];
}

export interface CardSetting { account_id: string; closing_day: number; due_day: number; }
export async function getCardSettings(): Promise<CardSetting[]> {
  const supabase = createClient();
  const { data } = await supabase.from("card_settings").select("account_id, closing_day, due_day");
  return data ?? [];
}

export interface DbDebt {
  id: string; name: string; outstanding_balance: number; rate: number | null;
  installments_total: number | null; installments_paid: number | null;
  installment_amount: number | null; due_date: string | null; updated_at: string | null;
}
export async function getDebts(): Promise<DbDebt[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("debts")
    .select("id, name, outstanding_balance, rate, installments_total, installments_paid, installment_amount, due_date, updated_at");
  return (data ?? []).map((d: any) => ({ ...d, outstanding_balance: Number(d.outstanding_balance), rate: d.rate == null ? null : Number(d.rate) }));
}

export interface DbCardBill { account_id: string; due_date: string | null; total_amount: number; status: string }
export async function getCardBills(): Promise<DbCardBill[]> {
  const supabase = createClient();
  const { data } = await supabase.from("card_bills").select("account_id, due_date, total_amount, status");
  return (data ?? []).map((b: any) => ({ ...b, total_amount: Number(b.total_amount) }));
}
