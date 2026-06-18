import { getAccounts, getTransactions, getConnections } from "@/lib/data";
import { DashboardReal } from "./dashboard-real";
import { DashboardMock } from "./dashboard-mock";

export default async function DashboardPage() {
  const [accounts, transactions, connections] = await Promise.all([
    getAccounts(), getTransactions(500), getConnections(),
  ]);
  if (accounts.length === 0) return <DashboardMock />;
  return <DashboardReal accounts={accounts} transactions={transactions} connections={connections} />;
}
