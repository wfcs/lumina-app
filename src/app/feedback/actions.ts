"use server";
import { createClient } from "@/lib/supabase/server";

export type FeedbackState = { ok?: boolean; error?: string };

const CATEGORIES = ["visual", "performance", "bug", "ideia", "outro"] as const;

export async function submitFeedback(_prev: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const category = String(formData.get("category") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  const page = String(formData.get("page") ?? "") || null;

  if (!CATEGORIES.includes(category as any)) return { error: "Selecione uma categoria." };
  if (message.length < 3) return { error: "Escreva um pouco mais sobre o feedback." };
  if (message.length > 4000) return { error: "Mensagem muito longa (máx. 4000 caracteres)." };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    category,
    message,
    page,
  });
  if (error) return { error: error.message };
  return { ok: true };
}
