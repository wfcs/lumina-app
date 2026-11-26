import { getAccounts, getConnections, getDebts, getCardBills, hasConnection } from "@/lib/data";
import { buildDebtPlan } from "@/lib/debt-plan";
import { DebtsReal } from "./debts-real";

export default async function DebtsPage() {
  const connected = await hasConnection();
  const [accounts, connections, debts, bills] = connected
    ? await Promise.all([getAccounts(), getConnections(), getDebts(), getCardBills()])
    : [[], [], [], []];
  const instById = new Map(connections.map((c) => [c.id, c.institution_name ?? "Cartão"]));
  const cards = accounts
    .filter((a) => (a.type ?? "").toUpperCase() === "CREDIT")
    .map((a) => ({ id: a.id, institution: instById.get(a.connection_id) ?? a.name ?? "Cartão",
      used: Math.abs(Number(a.balance)), limit: a.credit_limit == null ? null : Number(a.credit_limit) }));
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const plan = buildDebtPlan({ loans: debts, cards, bills, today });
  const syncs = connections.filter((c) => c.status !== "disconnected").map((c) => c.last_sync_at).filter(Boolean) as string[];
  const asOf = syncs.sort().at(-1) ?? null;
  const banks = Array.from(new Set(connections.filter((c) => c.status !== "disconnected").map((c) => c.institution_name).filter(Boolean))) as string[];
  return <DebtsReal plan={plan} asOf={asOf} banks={banks} />;
}
