import { createClient } from "@/lib/supabase/server";
import { getTransactions, getUserCategories } from "@/lib/data";
import { CategoriesView } from "./categories-view";

export default async function CategoriesPage() {
  const supabase = createClient();
  await supabase.rpc("ensure_default_categories");
  const [transactions, categories] = await Promise.all([getTransactions(2000), getUserCategories()]);
  return <CategoriesView transactions={transactions} categories={categories} />;
}
