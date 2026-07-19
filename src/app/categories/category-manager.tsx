"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ChevronRight, Plus, Trash2, Check, X, Loader2, FolderPlus } from "lucide-react";
import type { UserCategory } from "@/lib/data";
import { createCategory, deleteCategory } from "./actions";

export function CategoryManager({ categories }: { categories: UserCategory[] }) {
  const router = useRouter();
  const parents = categories.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(parentId: string | null) {
    if (!name.trim()) return;
    setBusy(true); setError(null);
    const res = await createCategory(name, parentId, parentId ? null : "📁");
    setBusy(false);
    if (res?.error) { setError(res.error); return; }
    setName(""); setAdding(null); router.refresh();
  }
  async function remove(id: string, label: string) {
    if (!confirm(`Excluir "${label}"${childrenOf(id).length ? " e suas subcategorias" : ""}?`)) return;
    const res = await deleteCategory(id);
    if (res?.error) { alert(res.error); return; }
    router.refresh();
  }

  function addInput(parentId: string | null, placeholder: string) {
    return (
      <div className="flex items-center gap-2 py-1.5">
        <input
          autoFocus value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(parentId); if (e.key === "Escape") { setAdding(null); setName(""); setError(null); } }}
          placeholder={placeholder}
          className="flex-1 h-9 px-3 rounded-lg border border-[var(--border)] bg-[var(--card-2)] text-sm outline-none focus:border-[var(--accent)]"
        />
        <button onClick={() => submit(parentId)} disabled={busy} className="grid place-items-center h-8 w-8 rounded-lg text-white" style={{ background: "linear-gradient(135deg,#7C3AED,#D7B8F3)" }}>{busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />}</button>
        <button onClick={() => { setAdding(null); setName(""); setError(null); }} className="grid place-items-center h-8 w-8 rounded-lg border border-[var(--border)] text-muted"><X size={15} /></button>
      </div>
    );
  }

  return (
    <Card>
      <div className="space-y-1.5">
        {parents.map((p) => {
          const kids = childrenOf(p.id);
          const open = expanded[p.id] ?? false;
          return (
            <div key={p.id} className="rounded-xl border border-[var(--border)]">
              <div className="flex items-center gap-2 p-3">
                <button onClick={() => setExpanded((s) => ({ ...s, [p.id]: !open }))} className="text-muted"><ChevronRight size={16} className={`transition-transform ${open ? "rotate-90" : ""}`} /></button>
                <span className="text-lg">{p.emoji ?? "📁"}</span>
                <span className="font-semibold text-sm flex-1">{p.name}</span>
                <span className="text-xs text-muted">{kids.length} sub</span>
                {!p.is_default && <button onClick={() => remove(p.id, p.name)} className="text-muted hover:text-danger" title="Excluir"><Trash2 size={15} /></button>}
              </div>
              {open && (
                <div className="px-3 pb-3 pl-10 space-y-1">
                  {kids.map((k) => (
                    <div key={k.id} className="flex items-center gap-2 text-sm py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                      <span className="flex-1">{k.name}</span>
                      {!k.is_default && <button onClick={() => remove(k.id, k.name)} className="text-muted hover:text-danger" title="Excluir"><Trash2 size={13} /></button>}
                    </div>
                  ))}
                  {adding === p.id
                    ? addInput(p.id, "Nova subcategoria")
                    : <button onClick={() => { setAdding(p.id); setName(""); setError(null); }} className="flex items-center gap-1.5 text-sm text-[var(--accent)] font-medium mt-1"><Plus size={15} /> Nova subcategoria</button>}
                  {error && adding === p.id && <p className="text-danger text-xs">{error}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-[var(--border)]">
        {adding === "ROOT"
          ? <>{addInput(null, "Nova categoria")}{error && <p className="text-danger text-xs mt-1">{error}</p>}</>
          : <button onClick={() => { setAdding("ROOT"); setName(""); setError(null); }} className="flex items-center gap-1.5 text-sm font-semibold text-white px-3 py-2 rounded-xl" style={{ background: "linear-gradient(135deg,#7C3AED,#D7B8F3)" }}><FolderPlus size={16} /> Nova categoria</button>}
      </div>
    </Card>
  );
}
