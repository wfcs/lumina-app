import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { code } = await request.json().catch(() => ({ code: null }));
  if (!code || typeof code !== "string") return NextResponse.json({ error: "Código ausente." }, { status: 400 });

  const { data, error } = await supabase.rpc("redeem_access_token", { p_code: code.trim() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const res = data as { ok: boolean; error?: string; trial_ends_at?: string; days?: number };
  if (!res?.ok) return NextResponse.json({ error: res?.error ?? "Token inválido." }, { status: 422 });
  return NextResponse.json({ ok: true, trial_ends_at: res.trial_ends_at, days: res.days });
}
