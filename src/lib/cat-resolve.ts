import type { DbTransaction, UserCategory } from "./data";
import { categoryPtBr } from "./categories-ptbr";

// Resolve a categoria de uma transação: usa a atribuída (category_id) e, na
// ausência, cai na categoria bruta traduzida. parentLabel = nível categoria,
// subLabel = subcategoria atribuída (null se não atribuída).
export type Resolver = ReturnType<typeof makeResolver>;

export function makeResolver(cats: UserCategory[]) {
  const byId = new Map(cats.map((c) => [c.id, c]));
  return {
    parentLabel(t: DbTransaction): string {
      const c = t.category_id ? byId.get(t.category_id) : undefined;
      if (c) return c.parent_id ? (byId.get(c.parent_id)?.name ?? c.name) : c.name;
      return categoryPtBr(t.category);
    },
    subLabel(t: DbTransaction): string | null {
      const c = t.category_id ? byId.get(t.category_id) : undefined;
      return c ? c.name : null;
    },
    // rótulo "melhor disponível" para exibir na linha da transação
    label(t: DbTransaction): string {
      const c = t.category_id ? byId.get(t.category_id) : undefined;
      return c ? c.name : categoryPtBr(t.category);
    },
  };
}
