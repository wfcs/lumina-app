import { createClient } from "@/lib/supabase/server";
import { autocategorize } from "@/server/autocategorize";
import { getTransactions, getUserCategories, hasConnection } from "@/lib/data";
import { TransactionsReal } from "./transactions-real";
import { TransactionsMock } from "./transactions-mock";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Clock } from "lucide-react";

export default async function TransactionsPage() {
  if (!(await hasConnection())) return <TransactionsMock />;
  const supabase = createClient();
  await supabase.rpc("ensure_default_categories");
  await autocategorize();
  const [transactions, categories] = await Promise.all([getTransactions(500), getUserCategories()]);
  if (transactions.length === 0) {
    return (
      <div>
        <PageHeader title="Transações" subtitle="Movimentações via Open Finance" />
        <Card className="text-center py-14">
          <Clock size={34} className="mx-auto text-muted mb-3" />
          <p className="font-semibold">Extrato ainda sendo coletado</p>
          <p className="text-muted text-sm mt-1">Clique em <b>Atualizar</b> (↻ no topo) em alguns instantes.</p>
        </Card>
      </div>
    );
  }
  return <TransactionsReal transactions={transactions} categories={categories} />;
}
