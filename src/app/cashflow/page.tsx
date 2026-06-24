import { createClient } from "@/lib/supabase/server";
import { autocategorize } from "@/server/autocategorize";
import { getTransactions, getUserCategories, hasConnection } from "@/lib/data";
import { CashflowReal } from "./cashflow-real";
import { CashflowMock } from "./cashflow-mock";

export default async function CashflowPage() {
  if (!(await hasConnection())) return <CashflowMock />;
  const supabase = createClient();
  await supabase.rpc("ensure_default_categories");
  await autocategorize();
  const [transactions, categories] = await Promise.all([getTransactions(1000), getUserCategories()]);
  if (transactions.length === 0) return <CashflowMock />;
  return <CashflowReal transactions={transactions} categories={categories} />;
}
