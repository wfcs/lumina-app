"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { CategoriesReal } from "./categories-real";
import { CategoryManager } from "./category-manager";
import type { DbTransaction, UserCategory } from "@/lib/data";

export function CategoriesView({ transactions, categories }: { transactions: DbTransaction[]; categories: UserCategory[] }) {
  const [tab, setTab] = useState<"view" | "manage">("view");
  return (
    <div>
      <PageHeader title="Categorias" subtitle={tab === "view" ? "Seus gastos por categoria (dados reais)" : "Cadastre e organize categorias e subcategorias"} />
      <div className="inline-flex rounded-lg border border-[var(--border)] p-0.5 mb-4">
        <button onClick={() => setTab("view")} className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === "view" ? "bg-brand text-white" : "text-muted"}`}>Visão</button>
        <button onClick={() => setTab("manage")} className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === "manage" ? "bg-brand text-white" : "text-muted"}`}>Gerenciar</button>
      </div>
      {tab === "view" ? <CategoriesReal transactions={transactions} categories={categories} /> : <CategoryManager categories={categories} />}
    </div>
  );
}
