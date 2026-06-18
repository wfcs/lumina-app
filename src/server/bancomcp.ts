// Banco MCP (MCP.AI) — agregação Open Finance via Pluggy. Somente leitura.
import { mapStatus, signedAmount } from "./pluggy";

const BASE = process.env.BANCOMCP_BASE_URL ?? "https://api.mcp.ai";
const OF = `${BASE}/api/openfinance`;

export function bancoMcpConfigured(): boolean {
  return !!process.env.BANCOMCP_API_KEY;
}

async function call(path: string, body: Record<string, unknown> = {}): Promise<any> {
  const res = await fetch(`${OF}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.BANCOMCP_API_KEY ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    const err = json?.error;
    if (err?.code === "not_connected") {
      throw new Error("NOT_CONNECTED: conecte um banco primeiro pelo botão \"Conectar banco\".");
    }
    const detail = err?.message ?? (typeof json === "object" ? JSON.stringify(json) : String(json));
    throw new Error(`Banco MCP ${path}: ${res.status} ${detail ?? ""}`.trim().slice(0, 300));
  }
  return json.result;
}

const arr = (r: any, ...keys: string[]) => {
  for (const k of keys) if (Array.isArray(r?.[k])) return r[k];
  return Array.isArray(r) ? r : [];
};

export async function listConnections() {
  const r = await call("/connections/list");
  return { connections: arr(r, "connections"), addUrl: r?.add_connection_url ?? null };
}
export async function getAddConnectionUrl(): Promise<string | null> {
  // O connect_url vem no result (já conectado) OU dentro do erro 409 not_connected.
  const res = await fetch(`${OF}/connectors/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.BANCOMCP_API_KEY ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ keywords: ["nubank", "itau", "bradesco", "santander", "inter", "c6", "caixa", "bb"] }),
    cache: "no-store",
  });
  const json: any = await res.json().catch(() => null);
  const r = json?.result;
  if (r?.connect_url_base) return r.connect_url_base as string;
  if (Array.isArray(r?.banks) && r.banks[0]?.connect_url) return r.banks[0].connect_url as string;
  if (json?.error?.connect_url) return json.error.connect_url as string; // 409 not_connected
  return null;
}
export async function listAccounts(item?: string) {
  const r = await call("/accounts/list", item ? { item } : {});
  return arr(r, "accounts", "results");
}
export async function listTransactions(accountId: string, from?: string) {
  const r = await call("/transactions/list", { account_id: accountId, from, page_size: 500 });
  return arr(r, "transactions", "results");
}

export async function disconnectBank(item: string) {
  return call("/connections/disconnect", { item });
}

function num(v: any): number { const n = Number(v); return Number.isFinite(n) ? n : 0; }

// Sincroniza tudo do contexto da workspace key → Supabase (reusa as tabelas).
export async function syncBancoMcp(supabase: any, userId: string) {
  const { connections } = await listConnections();
  let accCount = 0, txCount = 0;

  for (const c of connections) {
    const itemId = c.item_id ?? c.connector_id ?? String(c.id ?? "");
    const { data: conn, error: connErr } = await supabase
      .from("connections")
      .upsert(
        {
          user_id: userId,
          pluggy_item_id: `bancomcp:${itemId}`,
          institution_name: c.connector_name ?? c.name ?? "Banco",
          status: mapStatus(c.status),
          last_sync_at: new Date().toISOString(),
        },
        { onConflict: "pluggy_item_id" }
      )
      .select("id")
      .single();
    if (connErr) throw connErr;

    const accounts = await listAccounts(itemId);
    for (const a of accounts) {
      const accId = a.id ?? a.account_id ?? a.uuid;
      if (!accId) continue;
      const balance = num(a.balance ?? a.currentBalance ?? a.balanceData?.balance);
      const limit = a.creditData?.creditLimit ?? a.creditData?.limit ?? a.credit_limit ?? null;
      const { data: savedAcc, error: accErr } = await supabase
        .from("accounts")
        .upsert(
          {
            user_id: userId,
            connection_id: conn.id,
            pluggy_account_id: `bancomcp:${accId}`,
            type: a.type ?? null,
            subtype: a.subtype ?? null,
            name: a.name ?? a.marketingName ?? a.connector_name ?? "Conta",
            number: a.number ?? null,
            balance,
            credit_limit: limit != null ? num(limit) : null,
            currency: a.currencyCode ?? a.currency ?? "BRL",
          },
          { onConflict: "pluggy_account_id" }
        )
        .select("id")
        .single();
      if (accErr) throw accErr;
      accCount++;

      try {
        const since = new Date(Date.now() - 120 * 86400000).toISOString().slice(0, 10);
        const txs = await listTransactions(accId, since);
        if (txs.length) {
          const rows = txs.map((t: any) => {
            const txId = t.id ?? t.transaction_id ?? t.uuid;
            return {
              user_id: userId,
              account_id: savedAcc.id,
              pluggy_transaction_id: `bancomcp:${txId}`,
              description: t.description ?? t.descriptionRaw ?? t.merchant?.name ?? "Transação",
              amount: signedAmount({ amount: num(t.amount ?? t.value), type: t.type }),
              type: t.type ?? null,
              date: String(t.date ?? t.postedAt ?? "").slice(0, 10),
              category: t.category ?? t.categoryName ?? null,
              currency: t.currencyCode ?? t.currency ?? "BRL",
            };
          }).filter((r: any) => r.date && r.pluggy_transaction_id !== "bancomcp:undefined");
          if (rows.length) {
            const { error: txErr } = await supabase
              .from("transactions").upsert(rows, { onConflict: "pluggy_transaction_id" });
            if (txErr) throw txErr;
            txCount += rows.length;
          }
        }
      } catch { /* extrato pode estar coletando ainda */ }
    }
  }
  return { connections: connections.length, accounts: accCount, transactions: txCount };
}
