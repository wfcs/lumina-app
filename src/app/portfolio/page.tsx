import { getAccounts, hasConnection } from "@/lib/data";
import { PortfolioReal } from "./portfolio-real";
import { PortfolioMock } from "./portfolio-mock";

export default async function PortfolioPage() {
  if (!(await hasConnection())) return <PortfolioMock />;
  const accounts = await getAccounts();
  if (accounts.length === 0) return <PortfolioMock />;
  return <PortfolioReal accounts={accounts} />;
}
