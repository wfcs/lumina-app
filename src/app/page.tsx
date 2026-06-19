import { createClient } from "@/lib/supabase/server";
import { getAccounts, getTransactions, getConnections, getUserCategories } from "@/lib/data";
import { DashboardReal } from "./dashboard-real";
import { DashboardMock } from "./dashboard-mock";

export default async function DashboardPage() {
  const accounts = await getAccounts();
  if (accounts.length === 0) return <DashboardMock />;
  const supabase = createClient();
  await supabase.rpc("ensure_default_categories");
  const [transactions, connections, categories] = await Promise.all([
    getTransactions(500), getConnections(), getUserCategories(),
  ]);
  return <DashboardReal accounts={accounts} transactions={transactions} connections={connections} categories={categories} />;
}
