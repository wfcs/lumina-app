import { getTransactions, hasConnection } from "@/lib/data";
import { TransactionsReal } from "./transactions-real";
import { TransactionsMock } from "./transactions-mock";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Clock } from "lucide-react";

export default async function TransactionsPage() {
  const connected = await hasConnection();
  if (!connected) return <TransactionsMock />;

  const transactions = await getTransactions(500);
  if (transactions.length === 0) {
    return (
      <div>
        <PageHeader title="Transações" subtitle="Movimentações via Open Finance" />
        <Card className="text-center py-14">
          <Clock size={34} className="mx-auto text-muted mb-3" />
          <p className="font-semibold">Extrato ainda sendo coletado</p>
          <p className="text-muted text-sm mt-1">A Pluggy importa o histórico em segundo plano. Clique em <b>Atualizar</b> (ícone ↻ no topo) em alguns instantes.</p>
        </Card>
      </div>
    );
  }
  return <TransactionsReal transactions={transactions} />;
}
