"use server";
import { createClient } from "@/lib/supabase/server";

export async function createCategory(name: string, parentId: string | null, emoji?: string | null) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };
  const clean = name.trim().slice(0, 60);
  if (clean.length < 1) return { error: "Informe um nome." };
  const { error } = await supabase.from("user_categories").insert({
    user_id: user.id, name: clean, parent_id: parentId, emoji: emoji ?? null, is_default: false,
  });
  if (error) return { error: error.code === "23505" ? "Já existe uma com esse nome aqui." : error.message };
  return { ok: true };
}

export async function deleteCategory(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("user_categories").delete().eq("id", id);
  if (error) return { error: error.message };
  return { ok: true };
}
