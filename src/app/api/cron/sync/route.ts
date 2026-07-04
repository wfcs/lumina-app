import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { bancoMcpConfigured, syncBancoMcp } from "@/server/bancomcp";

// GET /api/cron/sync — sincroniza o Open Finance (Banco MCP) de todos os usuários
// que têm conexões. Protegido por CRON_SECRET.
// Agendado 8x/dia (a cada 3h) via vercel.json ou cron externo (ver docs/CRON_SETUP.md).
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const url = new URL(request.url);
    const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? url.searchParams.get("secret");
    if (provided !== secret) return new Response("Unauthorized", { status: 401 });
  }
  if (!bancoMcpConfigured()) return NextResponse.json({ ok: true, note: "Banco MCP não configurado." });

  const db = createServiceClient();
  const { data: conns } = await db
    .from("connections").select("user_id, pluggy_item_id").like("pluggy_item_id", "bancomcp:%");
  const userIds = Array.from(new Set((conns ?? []).map((c: { user_id: string }) => c.user_id)));

  let accounts = 0, transactions = 0;
  const errors: string[] = [];
  for (const uid of userIds) {
    try {
      const r = await syncBancoMcp(db, uid);
      accounts += r.accounts; transactions += r.transactions;
    } catch (e) { errors.push(`${uid}: ${e}`); }
  }
  return NextResponse.json({ ok: errors.length === 0, users: userIds.length, accounts, transactions, errors, at: new Date().toISOString() });
}
