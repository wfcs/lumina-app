import { createClient } from "@/lib/supabase/server";
import { getTransactions, getUserCategories, hasConnection } from "@/lib/data";
import { RecurringReal } from "./recurring-real";
import { RecurringMock } from "./recurring-mock";

export default async function RecurringPage() {
  if (!(await hasConnection())) return <RecurringMock />;
  const supabase = createClient();
  await supabase.rpc("ensure_default_categories");
  const [transactions, categories] = await Promise.all([getTransactions(2000), getUserCategories()]);
  if (transactions.length === 0) return <RecurringMock />;
  return <RecurringReal transactions={transactions} categories={categories} />;
}
