"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUI } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, ArrowLeftRight, Repeat, TrendingUp, Wallet,
  Receipt, Tags, Target, LineChart, PiggyBank, X,
} from "lucide-react";

const nav = [
  { href: "/", label: "Visão Geral", icon: LayoutDashboard },
  { href: "/transactions", label: "Transações", icon: ArrowLeftRight },
  { href: "/recurring", label: "Recorrentes", icon: Repeat },
  { href: "/cashflow", label: "Fluxo de Caixa", icon: TrendingUp },
  { href: "/accounts", label: "Contas", icon: Wallet },
  { href: "/bills", label: "Faturas", icon: Receipt },
  { href: "/categories", label: "Categorias", icon: Tags },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/projection", label: "Projeção", icon: LineChart },
  { href: "/portfolio", label: "Patrimônio", icon: PiggyBank },
];

export function Sidebar() {
  const pathname = usePathname();
  const { mobileNavOpen, setMobileNav } = useUI();
  return (
    <>
      {mobileNavOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" onClick={() => setMobileNav(false)} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[252px] flex flex-col transition-transform duration-300",
          "bg-[var(--bg-elev)] border-r border-[var(--border)]",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-[72px] flex items-center gap-3 px-6">
          <div className="relative h-9 w-9 rounded-xl grid place-items-center font-display font-bold text-white shadow-glow-mint"
               style={{ background: "linear-gradient(135deg, var(--accent), var(--mint))" }}>
            L
          </div>
          <div className="leading-none">
            <div className="font-display font-bold text-lg tracking-tight">Lumina</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted mt-1">Clareza</div>
          </div>
          <button className="ml-auto md:hidden text-muted" onClick={() => setMobileNav(false)}><X size={18} /></button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileNav(false)}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active ? "text-white" : "text-muted hover:text-[var(--text)] hover:bg-white/[0.03]"
                )}
              >
                {active && (
                  <span className="absolute inset-0 rounded-xl border border-[var(--accent)]/30"
                        style={{ background: "linear-gradient(100deg, rgba(79,125,255,0.18), rgba(0,229,160,0.08))" }} />
                )}
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-[var(--mint)] shadow-glow-mint" />}
                <Icon size={18} className={cn("relative shrink-0", active ? "text-[var(--mint)]" : "")} />
                <span className="relative">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3">
          <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
            <div className="h-9 w-9 rounded-full grid place-items-center text-white font-semibold text-sm"
                 style={{ background: "linear-gradient(135deg, #8332AC, #E086D3)" }}>F</div>
            <div className="text-sm leading-tight">
              <div className="font-semibold">Felipe</div>
              <div className="text-muted text-xs">Plano Premium</div>
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
