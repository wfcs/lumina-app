import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bancoMcpConfigured, syncBancoMcp } from "@/server/bancomcp";
import { canUseOpenFinance } from "@/lib/access";

export async function POST() {
  if (!bancoMcpConfigured()) return NextResponse.json({ error: "Banco MCP não configurado." }, { status: 400 });
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!canUseOpenFinance(user.email)) return NextResponse.json({ error: "Open Finance indisponível para esta conta." }, { status: 403 });
  try {
    const result = await syncBancoMcp(supabase, user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
