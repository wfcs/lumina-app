import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/bancomcp/debug — diagnóstico: mostra status + corpo cru de cada endpoint.
// Remover depois de depurar.
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const BASE = process.env.BANCOMCP_BASE_URL ?? "https://api.mcp.ai";
  const OF = `${BASE}/api/openfinance`;
  const keyPresent = !!process.env.BANCOMCP_API_KEY;
  const keyPrefix = (process.env.BANCOMCP_API_KEY ?? "").slice(0, 8);

  async function probe(path: string, body: Record<string, unknown>) {
    try {
      const res = await fetch(`${OF}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.BANCOMCP_API_KEY ?? ""}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const text = await res.text();
      let json: unknown = null;
      try { json = JSON.parse(text); } catch { /* keep text */ }
      return { status: res.status, body: json ?? text.slice(0, 500) };
    } catch (e) {
      return { status: 0, body: String(e) };
    }
  }

  return NextResponse.json({
    keyPresent,
    keyPrefix: keyPrefix ? `${keyPrefix}…` : null,
    base: OF,
    connectors_search: await probe("/connectors/search", { keywords: ["nubank"] }),
    connections_list: await probe("/connections/list", {}),
  });
}
