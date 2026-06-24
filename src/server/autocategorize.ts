import { createClient } from "@/lib/supabase/server";
import { categoryPtBr } from "@/lib/categories-ptbr";

// Atribui category_id às transações ainda SEM categoria, casando a categoria
// bruta do extrato com as categorias do usuário. NÃO sobrescreve as já definidas
// (só toca em category_id null), então as alterações manuais ficam preservadas.
export async function autocategorize(): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: cats } = await supabase.from("user_categories").select("id, name, parent_id");
  if (!cats || cats.length === 0) return;
  const subMap = new Map<string, string>();
  const anyMap = new Map<string, string>();
  for (const c of cats as { id: string; name: string; parent_id: string | null }[]) {
    const k = c.name.trim().toLowerCase();
    if (c.parent_id && !subMap.has(k)) subMap.set(k, c.id);
    if (!anyMap.has(k)) anyMap.set(k, c.id);
  }

  const { data: rows } = await supabase
    .from("transactions").select("category").is("category_id", null).eq("user_id", user.id);
  if (!rows) return;
  const distinct = Array.from(new Set((rows as { category: string | null }[]).map((r) => r.category).filter((x): x is string => !!x)));

  for (const raw of distinct) {
    const candidates = [categoryPtBr(raw), raw].map((x) => x.trim().toLowerCase());
    let targetId: string | undefined;
    for (const k of candidates) { targetId = subMap.get(k) ?? anyMap.get(k); if (targetId) break; }
    if (!targetId) continue;
    await supabase.from("transactions").update({ category_id: targetId })
      .is("category_id", null).eq("user_id", user.id).eq("category", raw);
  }
}
