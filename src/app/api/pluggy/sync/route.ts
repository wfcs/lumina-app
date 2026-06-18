import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getApiKey, getItem, getAccounts, getTransactions,
  mapStatus, signedAmount, pluggyConfigured,
} from "@/server/pluggy";

// POST /api/pluggy/sync  { itemId }
// Resiliente: salva conexão + contas mesmo que as transações ainda estejam
// sendo coletadas pela Pluggy (410). Transações são sincronizadas depois.
export async function POST(request: Request) {
  if (!pluggyConfigured()) {
    return NextResponse.json({ error: "Pluggy não configurado no servidor." }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { itemId } = await request.json().catch(() => ({ itemId: null }));
  if (!itemId) return NextResponse.json({ error: "itemId ausente." }, { status: 400 });

  try {
    const apiKey = await getApiKey();
    const item = await getItem(itemId, apiKey);
    const itemReady = item?.status === "UPDATED";

    // 1) conexão (se ainda atualizando, marca como instável p/ re-sync depois)
    const { data: conn, error: connErr } = await supabase
      .from("connections")
      .upsert(
        {
          user_id: user.id,
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

    // 2) contas
    const accounts = await getAccounts(itemId, apiKey);
    let txCount = 0;
    let txPending = false;

    for (const acc of accounts) {
      const { data: savedAcc, error: accErr } = await supabase
        .from("accounts")
        .upsert(
          {
            user_id: user.id,
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

      // 3) transações — não fatal: se ainda coletando (410) ou erro, pula
      try {
        const txs = await getTransactions(acc.id, apiKey);
        if (txs.length) {
          const rows = txs.map((t) => ({
            user_id: user.id,
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
      } catch (txe) {
        // transações ainda não disponíveis para esta conta — segue o fluxo
        txPending = true;
      }
    }

    return NextResponse.json({
      ok: true,
      accounts: accounts.length,
      transactions: txCount,
      transactionsPending: txPending || !itemReady,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
