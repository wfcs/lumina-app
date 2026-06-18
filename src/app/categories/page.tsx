import { getTransactions, hasConnection } from "@/lib/data";
import { CategoriesReal } from "./categories-real";
import { CategoriesMock } from "./categories-mock";

export default async function CategoriesPage() {
  if (!(await hasConnection())) return <CategoriesMock />;
  const transactions = await getTransactions(1000);
  if (transactions.length === 0) return <CategoriesMock />;
  return <CategoriesReal transactions={transactions} />;
}
