import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pluggyConfigured } from "@/server/pluggy";
import { resyncUser } from "@/server/sync";

export async function POST() {
  if (!pluggyConfigured()) {
    return NextResponse.json({ error: "Pluggy não configurado." }, { status: 400 });
  }
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  try {
    const result = await resyncUser(supabase, user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
