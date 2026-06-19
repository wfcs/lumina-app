"use server";
import { createClient } from "@/lib/supabase/server";

export async function setTransactionCategory(transactionId: string, categoryId: string | null) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };
  const { error } = await supabase
    .from("transactions")
    .update({ category_id: categoryId })
    .eq("id", transactionId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function createCategoryFor(name: string, parentId: string | null) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };
  const clean = name.trim().slice(0, 60);
  if (!clean) return { error: "Informe um nome." };
  const { data, error } = await supabase
    .from("user_categories")
    .insert({ user_id: user.id, name: clean, parent_id: parentId, is_default: false, emoji: parentId ? null : "📁" })
    .select("id")
    .single();
  if (error) return { error: error.code === "23505" ? "Já existe com esse nome." : error.message };
  return { ok: true, id: data.id as string };
}
