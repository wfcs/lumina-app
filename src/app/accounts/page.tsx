import { getAccounts, getConnections } from "@/lib/data";
import { AccountsReal } from "./accounts-real";
import { AccountsMock } from "./accounts-mock";

export default async function AccountsPage() {
  const [accounts, connections] = await Promise.all([getAccounts(), getConnections()]);
  if (accounts.length === 0) return <AccountsMock />;
  return <AccountsReal accounts={accounts} connections={connections} />;
}
