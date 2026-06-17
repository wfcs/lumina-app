import { createClient } from "@/lib/supabase/server";

export interface DbAccount {
  id: string; connection_id: string; type: string | null; subtype: string | null;
  name: string | null; balance: number; credit_limit: number | null; currency: string;
}
export interface DbConnection {
  id: string; institution_name: string | null; institution_image: string | null;
  status: string; last_sync_at: string | null;
}
export interface DbTransaction {
  id: string; account_id: string; description: string | null; amount: number;
  type: string | null; date: string; category: string | null;
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
  const { data } = await supabase
    .from("accounts")
    .select("id, connection_id, type, subtype, name, balance, credit_limit, currency");
  return data ?? [];
}

export async function getTransactions(limit = 200): Promise<DbTransaction[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("transactions")
    .select("id, account_id, description, amount, type, date, category")
    .order("date", { ascending: false })
    .limit(limit);
  return data ?? [];
}
