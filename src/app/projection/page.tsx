import { getAccounts, getTransactions, hasConnection } from "@/lib/data";
import { ProjectionReal } from "./projection-real";
import { ProjectionMock } from "./projection-mock";

export default async function ProjectionPage() {
  if (!(await hasConnection())) return <ProjectionMock />;
  const [accounts, transactions] = await Promise.all([getAccounts(), getTransactions(3000)]);
  if (transactions.length === 0) return <ProjectionMock />;
  return <ProjectionReal accounts={accounts} transactions={transactions} />;
}
