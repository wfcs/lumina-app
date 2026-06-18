import { getTransactions, hasConnection } from "@/lib/data";
import { CashflowReal } from "./cashflow-real";
import { CashflowMock } from "./cashflow-mock";

export default async function CashflowPage() {
  if (!(await hasConnection())) return <CashflowMock />;
  const transactions = await getTransactions(1000);
  if (transactions.length === 0) return <CashflowMock />;
  return <CashflowReal transactions={transactions} />;
}
