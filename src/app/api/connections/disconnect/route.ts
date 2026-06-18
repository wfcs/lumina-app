import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bancoMcpConfigured, disconnectBank } from "@/server/bancomcp";

// POST /api/connections/disconnect { connectionId }
// Revoga no provedor (Banco MCP) e remove a conexão localmente (cascata: contas+transações).
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { connectionId } = await request.json().catch(() => ({ connectionId: null }));
  if (!connectionId) return NextResponse.json({ error: "connectionId ausente." }, { status: 400 });

  // valida posse + pega o item_id
  const { data: conn, error: selErr } = await supabase
    .from("connections")
    .select("id, pluggy_item_id, institution_name")
    .eq("id", connectionId)
    .single();
  if (selErr || !conn) return NextResponse.json({ error: "Conexão não encontrada." }, { status: 404 });

  // revoga no provedor (best-effort; não bloqueia a remoção local)
  const raw = String(conn.pluggy_item_id ?? "");
  if (raw.startsWith("bancomcp:") && bancoMcpConfigured()) {
    const item = raw.slice("bancomcp:".length);
    try { await disconnectBank(item); } catch { /* segue para remoção local */ }
  }

  // remove localmente (FK on delete cascade derruba contas e transações)
  const { error: delErr } = await supabase.from("connections").delete().eq("id", connectionId);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
