import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bancoMcpConfigured, syncBancoMcp } from "@/server/bancomcp";
import { pluggyConfigured } from "@/server/pluggy";
import { resyncUser } from "@/server/sync";
import { canUseOpenFinance } from "@/lib/access";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  let accounts = 0, transactions = 0;
  const errors: string[] = [];
  if (bancoMcpConfigured() && canUseOpenFinance(user.email)) {
    try { const r = await syncBancoMcp(supabase, user.id); accounts += r.accounts; transactions += r.transactions; }
    catch (e) { errors.push(`Banco MCP: ${e}`); }
  }
  if (pluggyConfigured()) {
    try { const r = await resyncUser(supabase, user.id); accounts += r.accounts; transactions += r.transactions; }
    catch (e) { errors.push(`Pluggy: ${e}`); }
  }
  if (!bancoMcpConfigured() && !pluggyConfigured()) {
    return NextResponse.json({ ok: true, accounts: 0, transactions: 0, note: "Nenhum provedor configurado." });
  }
  return NextResponse.json({ ok: errors.length === 0, accounts, transactions, errors });
}
