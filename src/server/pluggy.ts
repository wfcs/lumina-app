// ─────────────────────────────────────────────────────────────
// Stub do cliente Pluggy (pluggy.ai) — Open Finance Brasil
// Substitua por chamadas reais usando suas credenciais.
// Docs: https://docs.pluggy.ai
// ─────────────────────────────────────────────────────────────
//
// Fluxo recomendado:
//   1. Backend autentica com CLIENT_ID/CLIENT_SECRET → API key
//   2. Backend gera um "connect token" e envia ao frontend
//   3. Frontend abre o Pluggy Connect Widget com esse token
//   4. Usuário escolhe a instituição e autoriza (Open Finance)
//   5. Pluggy retorna um itemId → você persiste e busca contas/transações
//   6. Webhook notifica novas transações (assine em /api/pluggy/webhook)

const PLUGGY_BASE = "https://api.pluggy.ai";

export interface PluggyConfig {
  clientId: string;
  clientSecret: string;
}

function getConfig(): PluggyConfig | null {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

// Passo 1: obter API key (válida por ~2h)
export async function getApiKey(): Promise<string> {
  const cfg = getConfig();
  if (!cfg) throw new Error("PLUGGY_CLIENT_ID/SECRET não configurados (.env.local)");
  const res = await fetch(`${PLUGGY_BASE}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg),
  });
  if (!res.ok) throw new Error(`Pluggy auth falhou: ${res.status}`);
  const data = await res.json();
  return data.apiKey as string;
}

// Passo 2: gerar connect token para o widget no frontend
export async function createConnectToken(itemId?: string): Promise<string> {
  const apiKey = await getApiKey();
  const res = await fetch(`${PLUGGY_BASE}/connect_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
    body: JSON.stringify(itemId ? { itemId } : {}),
  });
  if (!res.ok) throw new Error(`connect_token falhou: ${res.status}`);
  const data = await res.json();
  return data.accessToken as string;
}

// Passo 5: buscar contas de um item conectado
export async function listAccounts(itemId: string) {
  const apiKey = await getApiKey();
  const res = await fetch(`${PLUGGY_BASE}/accounts?itemId=${itemId}`, {
    headers: { "X-API-KEY": apiKey },
  });
  return res.json();
}

// Passo 5: buscar transações de uma conta
export async function listTransactions(accountId: string) {
  const apiKey = await getApiKey();
  const res = await fetch(`${PLUGGY_BASE}/transactions?accountId=${accountId}`, {
    headers: { "X-API-KEY": apiKey },
  });
  return res.json();
}
