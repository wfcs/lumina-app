"use client";
import { useUI } from "@/lib/store";
import { useTheme } from "next-themes";
import { Eye, EyeOff, Moon, Sun, Menu, RefreshCw, Bell, Search } from "lucide-react";
import { useEffect, useState } from "react";

export function Header() {
  const { hideValues, toggleHideValues, setMobileNav } = useUI();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = theme !== "light";

  return (
    <header className="h-[72px] sticky top-0 z-20 flex items-center gap-3 px-4 md:px-8 border-b border-[var(--border)] bg-[var(--bg)]/70 backdrop-blur-xl">
      <button className="md:hidden text-muted" onClick={() => setMobileNav(true)}><Menu size={20} /></button>

      <div className="hidden sm:flex items-center gap-2 px-3 h-9 rounded-xl border border-[var(--border)] bg-[var(--card)] text-muted text-sm w-64">
        <Search size={15} /><span className="text-xs">Buscar transações, contas…</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-muted px-3 h-9 rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--mint)] shadow-glow-mint" /> 5 conexões ativas
        </span>
        <IconBtn title="Atualizar agora"><RefreshCw size={17} /></IconBtn>
        <IconBtn title="Notificações"><Bell size={17} /><span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[var(--danger,#FF6B7A)]" /></IconBtn>
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
