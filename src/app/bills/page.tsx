import { getAccounts, getTransactions, getCardSettings, hasConnection } from "@/lib/data";
import { BillsReal } from "./bills-real";
import { BillsMock } from "./bills-mock";

export default async function BillsPage() {
  if (!(await hasConnection())) return <BillsMock />;
  const [accounts, transactions, cardSettings] = await Promise.all([
    getAccounts(), getTransactions(3000), getCardSettings(),
  ]);
  return <BillsReal accounts={accounts} transactions={transactions} cardSettings={cardSettings} />;
}
