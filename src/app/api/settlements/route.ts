import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Registro de baixas de dívidas (fatura, parcela, amortização). Só anota qual transação pagou;
// nenhuma movimentação financeira acontece aqui (R-SEG-03). RLS garante que cada um só vê o seu.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const KEY = /^[0-9a-f-]{36}(:\d{4}-\d{2}(-\d{2})?)?$/i;
const KINDS = new Set(["bill", "installment", "amortization"]);

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Faça login." }, { status: 401 });
  const b = await req.json().catch(() => null);
  if (!b || !KINDS.has(b.kind) || typeof b.target_key !== "string" || !KEY.test(b.target_key))
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  const rejected = b.source === "rejected";
  if (!rejected && (typeof b.transaction_id !== "string" || !UUID.test(b.transaction_id)))
    return NextResponse.json({ error: "Escolha uma transação." }, { status: 400 });
  if (rejected && b.kind === "amortization") return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  // A transação precisa ser do usuário (RLS) e ser uma saída.
  if (!rejected) {
    const { data: t } = await supabase.from("transactions").select("id, amount").eq("id", b.transaction_id).maybeSingle();
    if (!t || Number(t.amount) >= 0) return NextResponse.json({ error: "Transação não encontrada ou não é uma saída." }, { status: 400 });
    b.amount = Math.abs(Number(t.amount));
  }
  if (b.kind !== "amortization") {
    await supabase.from("debt_settlements").delete().eq("kind", b.kind).eq("target_key", b.target_key);
  }
  const { error } = await supabase.from("debt_settlements").insert({
    kind: b.kind, target_key: b.target_key, transaction_id: rejected ? null : b.transaction_id,
    amount: rejected ? null : b.amount, source: rejected ? "rejected" : "manual",
  });
  if (error) return NextResponse.json({ error: "Não foi possível salvar." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Faça login." }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  const { error } = await supabase.from("debt_settlements").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Não foi possível desfazer." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
