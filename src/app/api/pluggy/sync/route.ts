import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApiKey, pluggyConfigured } from "@/server/pluggy";
import { syncItem } from "@/server/sync";

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
    const result = await syncItem(supabase, user.id, itemId, apiKey);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
