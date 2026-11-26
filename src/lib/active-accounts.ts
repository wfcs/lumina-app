// Contas de conexões desligadas no agregador ficam com saldo congelado: não entram nas telas.
export function activeAccounts<A extends { connection_id: string | null }>(
  accounts: A[],
  connections: { id: string; status: string | null }[],
): A[] {
  const off = new Set(connections.filter((c) => c.status === "disconnected").map((c) => c.id));
  return accounts.filter((a) => !a.connection_id || !off.has(a.connection_id));
}
