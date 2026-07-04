"use server";
import { createClient } from "@/lib/supabase/server";

export async function saveCardCycle(accountId: string, closingDay: number, dueDay: number) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };
  const cd = Math.min(31, Math.max(1, Math.round(closingDay || 1)));
  const dd = Math.min(31, Math.max(1, Math.round(dueDay || 10)));
  const { error } = await supabase.from("card_settings").upsert(
    { account_id: accountId, user_id: user.id, closing_day: cd, due_day: dd, updated_at: new Date().toISOString() },
    { onConflict: "account_id" }
  );
  if (error) return { error: error.message };
  return { ok: true };
}
