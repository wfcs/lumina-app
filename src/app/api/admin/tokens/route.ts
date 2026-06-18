import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/access";

function genCode(): string {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LUM-${part()}-${part()}-${part()}`;
}

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  const { data, error } = await supabase
    .from("access_tokens")
    .select("id, code, days, note, redeemed_by, redeemed_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tokens: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const days = Math.floor(Number(body.days));
  const note = typeof body.note === "string" ? body.note.slice(0, 200) : null;
  if (!Number.isFinite(days) || days < 1 || days > 3650) {
    return NextResponse.json({ error: "Dias inválidos (1 a 3650)." }, { status: 400 });
  }

  for (let i = 0; i < 5; i++) {
    const code = genCode();
    const { data, error } = await supabase
      .from("access_tokens")
      .insert({ code, days, note, created_by: user.id })
      .select("id, code, days, note, created_at")
      .single();
    if (!error) return NextResponse.json({ ok: true, token: data });
    if (error.code !== "23505") return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ error: "Falha ao gerar código único." }, { status: 500 });
}
