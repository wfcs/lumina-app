"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidTaxId, onlyDigits } from "@/lib/tax-id";

export type OnboardState = { error?: string };

export async function saveTaxId(_prev: OnboardState, formData: FormData): Promise<OnboardState> {
  const raw = String(formData.get("taxId") ?? "");
  const digits = onlyDigits(raw);

  if (!isValidTaxId(digits)) {
    return { error: "CPF ou CNPJ inválido. Confira os dígitos." };
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Faça login novamente." };

  const { error } = await supabase.from("profiles").update({ tax_id: digits }).eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { error: "Este CPF/CNPJ já está cadastrado em outra conta." };
    }
    if (error.code === "23514") {
      return { error: "CPF ou CNPJ inválido." };
    }
    return { error: error.message };
  }

  redirect("/");
}
