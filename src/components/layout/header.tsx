"use client";
import { useUI } from "@/lib/store";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Moon, Sun, Menu, RefreshCw, Bell, Search } from "lucide-react";
import { useEffect, useState } from "react";

export function Header() {
  const { hideValues, toggleHideValues, setMobileNav } = useUI();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);
  const dark = theme !== "light";

  async function resync() {
    if (refreshing) return;
    setRefreshing(true);
    setMsg(null);
    try {
      const res = await fetch("/api/pluggy/resync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao atualizar.");
      setMsg(
        data.transactionsPending
          ? "Atualizado. Extrato ainda sendo coletado pela Pluggy — tente de novo em instantes."
          : `Atualizado: ${data.accounts} conta(s), ${data.transactions} transação(ões).`
      );
      router.refresh();
    } catch (e: any) {
      setMsg(e.message ?? "Erro ao atualizar.");
    } finally {
      setRefreshing(false);
      setTimeout(() => setMsg(null), 6000);
    }
  }

  return (
    <header className="h-[72px] sticky top-0 z-20 flex items-center gap-3 px-4 md:px-8 border-b border-[var(--border)] bg-[var(--bg)]/70 backdrop-blur-xl">
      <button className="md:hidden text-muted" onClick={() => setMobileNav(true)}><Menu size={20} /></button>

      <div className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-xl border border-[var(--border)] bg-[var(--card)] text-muted text-sm w-64">
        <Search size={15} /><span className="text-xs">Buscar transações, contas…</span>
      </div>

      {msg && (
        <span className="hidden lg:inline text-xs text-muted truncate max-w-md">{msg}</span>
      )}

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-muted px-3 h-9 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--mint)] shadow-glow-mint" /> conectado
        </span>
        <IconBtn title="Atualizar dados (Open Finance)" onClick={resync}>
          <RefreshCw size={17} className={refreshing ? "animate-spin" : ""} />
        </IconBtn>
        <IconBtn title="Notificações"><Bell size={17} /><span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-danger" /></IconBtn>
        <IconBtn title={hideValues ? "Mostrar valores" : "Ocultar valores"} onClick={toggleHideValues}>
          {hideValues ? <EyeOff size={17} /> : <Eye size={17} />}
        </IconBtn>
        {mounted && (
          <IconBtn title="Tema" onClick={() => setTheme(dark ? "light" : "dark")}>
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </IconBtn>
        )}
      </div>
    </header>
  );
}

function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} title={title}
      className="relative grid place-items-center h-9 w-9 rounded-xl border border-[var(--border)] bg-[var(--card)] text-muted hover:text-[var(--text)] hover:border-[var(--accent)]/40 transition-colors">
      {children}
    </button>
  );
}
