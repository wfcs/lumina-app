import { getAccounts, hasConnection, getInvestments, getDebts } from "@/lib/data";
import { PortfolioReal } from "./portfolio-real";
import { PortfolioMock } from "./portfolio-mock";

export default async function PortfolioPage() {
  if (!(await hasConnection())) return <PortfolioMock />;
  const [accounts, investments, loans] = await Promise.all([getAccounts(), getInvestments(), getDebts()]);
  if (accounts.length === 0) return <PortfolioMock />;
  return <PortfolioReal accounts={accounts} investments={investments} loans={loans} />;
}
