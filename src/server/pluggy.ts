// Cliente Pluggy (Open Finance Brasil) — https://docs.pluggy.ai
// As credenciais (PLUGGY_CLIENT_ID/SECRET) ficam no .env — nunca no cliente.
const BASE = "https://api.pluggy.ai";

function creds() {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function pluggyConfigured() {
  return creds() !== null;
}

export async function getApiKey(): Promise<string> {
  const c = creds();
  if (!c) throw new Error("Pluggy não configurado (defina PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET).");
  const res = await fetch(`${BASE}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(c),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Pluggy /auth falhou: ${res.status}`);
  return (await res.json()).apiKey as string;
}

export async function createConnectToken(itemId?: string): Promise<string> {
  const apiKey = await getApiKey();
  const res = await fetch(`${BASE}/connect_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
    body: JSON.stringify(itemId ? { itemId } : {}),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Pluggy /connect_token falhou: ${res.status}`);
  return (await res.json()).accessToken as string;
}

async function apiGet(path: string, apiKey: string) {
  const res = await fetch(`${BASE}${path}`, { headers: { "X-API-KEY": apiKey }, cache: "no-store" });
  if (!res.ok) throw new Error(`Pluggy GET ${path} falhou: ${res.status}`);
  return res.json();
}

export async function getItem(itemId: string, apiKey: string) {
  return apiGet(`/items/${itemId}`, apiKey);
}
export async function getAccounts(itemId: string, apiKey: string) {
  const data = await apiGet(`/accounts?itemId=${itemId}`, apiKey);
  return (data.results ?? []) as any[];
}
export async function getTransactions(accountId: string, apiKey: string) {
  const data = await apiGet(`/transactions?accountId=${accountId}&pageSize=500`, apiKey);
  return (data.results ?? []) as any[];
}

// Mapeia status do Pluggy para o nosso (updated | unstable | expired)
export function mapStatus(pluggyStatus?: string): "updated" | "unstable" | "expired" {
  switch (pluggyStatus) {
    case "UPDATED": return "updated";
    case "LOGIN_ERROR":
    case "OUTDATED": return "expired";
    default: return "unstable";
  }
}

// Valor com sinal: saída negativa, entrada positiva
export function signedAmount(tx: { amount: number; type?: string }): number {
  const a = Math.abs(Number(tx.amount) || 0);
  return tx.type === "DEBIT" ? -a : a;
}
