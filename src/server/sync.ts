import {
  getApiKey, getItem, getAccounts, getTransactions, mapStatus, signedAmount,
} from "./pluggy";

type DB = any; // SupabaseClient com sessão do usuário

export interface SyncResult { accounts: number; transactions: number; transactionsPending: boolean; }

// Sincroniza um item (conexão) específico: conexão + contas + transações.
export async function syncItem(supabase: DB, userId: string, itemId: string, apiKey: string): Promise<SyncResult> {
  const item = await getItem(itemId, apiKey);
  const itemReady = item?.status === "UPDATED";

  const { data: conn, error: connErr } = await supabase
    .from("connections")
    .upsert(
      {
        user_id: userId,
        pluggy_item_id: itemId,
        institution_name: item?.connector?.name ?? null,
        institution_image: item?.connector?.imageUrl ?? null,
        status: itemReady ? mapStatus(item?.status) : "unstable",
        last_sync_at: new Date().toISOString(),
      },
      { onConflict: "pluggy_item_id" }
    )
    .select("id")
    .single();
  if (connErr) throw connErr;

  const accounts = await getAccounts(itemId, apiKey);
  let txCount = 0;
  let txPending = false;

  for (const acc of accounts) {
    const { data: savedAcc, error: accErr } = await supabase
      .from("accounts")
      .upsert(
        {
          user_id: userId,
          connection_id: conn.id,
          pluggy_account_id: acc.id,
          type: acc.type ?? null,
          subtype: acc.subtype ?? null,
          name: acc.name ?? acc.marketingName ?? null,
          number: acc.number ?? null,
          balance: acc.balance ?? 0,
          credit_limit: acc.creditData?.creditLimit ?? acc.creditData?.limit ?? null,
          currency: acc.currencyCode ?? "BRL",
        },
        { onConflict: "pluggy_account_id" }
      )
      .select("id")
      .single();
    if (accErr) throw accErr;

    try {
      const txs = await getTransactions(acc.id, apiKey);
      if (txs.length) {
        const rows = txs.map((t: any) => ({
          user_id: userId,
          account_id: savedAcc.id,
          pluggy_transaction_id: t.id,
          description: t.description ?? t.descriptionRaw ?? "",
          amount: signedAmount(t),
          type: t.type ?? null,
          date: (t.date ?? "").slice(0, 10),
          category: t.category ?? null,
          currency: t.currencyCode ?? "BRL",
        }));
        const { error: txErr } = await supabase
          .from("transactions")
          .upsert(rows, { onConflict: "pluggy_transaction_id" });
        if (txErr) throw txErr;
        txCount += rows.length;
      }
    } catch {
      txPending = true;
    }
  }

  return { accounts: accounts.length, transactions: txCount, transactionsPending: txPending || !itemReady };
}

// Re-sincroniza TODAS as conexões do usuário (botão "Atualizar").
export async function resyncUser(supabase: DB, userId: string): Promise<SyncResult> {
  const apiKey = await getApiKey();
  const { data: conns } = await supabase
    .from("connections").select("pluggy_item_id").eq("user_id", userId);
  let acc = 0, tx = 0, pending = false;
  for (const c of conns ?? []) {
    const r = await syncItem(supabase, userId, c.pluggy_item_id, apiKey);
    acc += r.accounts; tx += r.transactions; pending = pending || r.transactionsPending;
  }
  return { accounts: acc, transactions: tx, transactionsPending: pending };
}
