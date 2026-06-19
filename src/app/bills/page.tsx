import { getAccounts, getTransactions, hasConnection } from "@/lib/data";
import { BillsReal } from "./bills-real";
import { BillsMock } from "./bills-mock";

export default async function BillsPage() {
  if (!(await hasConnection())) return <BillsMock />;
  const [accounts, transactions] = await Promise.all([getAccounts(), getTransactions(2000)]);
  return <BillsReal accounts={accounts} transactions={transactions} />;
}
