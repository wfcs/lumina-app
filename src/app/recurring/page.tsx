import { getTransactions, hasConnection } from "@/lib/data";
import { RecurringReal } from "./recurring-real";
import { RecurringMock } from "./recurring-mock";

export default async function RecurringPage() {
  if (!(await hasConnection())) return <RecurringMock />;
  const transactions = await getTransactions(2000);
  if (transactions.length === 0) return <RecurringMock />;
  return <RecurringReal transactions={transactions} />;
}
