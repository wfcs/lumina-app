import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseStatement } from "@/server/statement-parser";

// POST /api/import  (multipart: file)
// Importa um extrato OFX/CSV → conexão "manual" + conta + transações.
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let text = "";
  let filename = "extrato.csv";
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
    filename = (file as File).name || filename;
    text = await (file as File).text();
  } catch {
    return NextResponse.json({ error: "Não foi possível ler o arquivo." }, { status: 400 });
  }

  const parsed = parseStatement(filename, text);
  if (parsed.transactions.length === 0) {
    return NextResponse.json({ error: "Nenhuma transação reconhecida no arquivo. Verifique o formato (OFX ou CSV com data, descrição e valor)." }, { status: 422 });
  }

  try {
    // conexão "manual" (uma por usuário, re-importável)
    const { data: conn, error: connErr } = await supabase
      .from("connections")
      .upsert(
        {
          user_id: user.id,
          pluggy_item_id: `manual:${user.id}`,
          institution_name: "Importação (OFX/CSV)",
          status: "updated",
          last_sync_at: new Date().toISOString(),
        },
        { onConflict: "pluggy_item_id" }
      )
      .select("id")
      .single();
    if (connErr) throw connErr;

    const balance = parsed.balance ?? parsed.transactions.reduce((s, t) => s + t.amount, 0);
    const { data: acc, error: accErr } = await supabase
      .from("accounts")
      .upsert(
        {
          user_id: user.id,
          connection_id: conn.id,
          pluggy_account_id: `manual:${user.id}:${parsed.accountKey}`,
          type: "BANK",
          subtype: "IMPORT",
          name: parsed.accountName,
          balance,
          currency: parsed.currency,
        },
        { onConflict: "pluggy_account_id" }
      )
      .select("id")
      .single();
    if (accErr) throw accErr;

    const rows = parsed.transactions.map((t) => ({
      user_id: user.id,
      account_id: acc.id,
      pluggy_transaction_id: `manual:${user.id}:${t.fitid}`,
      description: t.description,
      amount: t.amount,
      type: t.type,
      date: t.date,
      category: null,
      currency: parsed.currency,
    }));
    const { error: txErr } = await supabase
      .from("transactions")
      .upsert(rows, { onConflict: "pluggy_transaction_id" });
    if (txErr) throw txErr;

    return NextResponse.json({ ok: true, account: parsed.accountName, transactions: rows.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
