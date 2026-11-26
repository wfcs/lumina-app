"use client";
// Adaptado de React Bits — Stepper (https://reactbits.dev/components/stepper).
// Indicador de passos: concluído (ciano cheio, ✓), atual (anel ciano), próximo (cinza).
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  const reduce = useReducedMotion();
  return (
    <ol className="flex items-center gap-2 mb-6" aria-label="Passos da conexão">
      {steps.map((s, i) => {
        const done = i < current, now = i === current;
        return (
          <li key={s} className="flex items-center gap-2 flex-1 last:flex-none" aria-current={now ? "step" : undefined}>
            <span className="grid place-items-center h-7 w-7 shrink-0 rounded-full text-xs font-semibold border transition-colors"
              style={done ? { background: "var(--accent-fill)", color: "var(--on-accent)", borderColor: "var(--accent)" }
                : now ? { borderColor: "var(--accent)", color: "var(--accent)" } : { borderColor: "var(--border)", color: "var(--muted)" }}>
              {done ? <Check size={14} /> : i + 1}
            </span>
            <span className={`text-xs whitespace-nowrap ${now ? "text-[var(--text)] font-semibold" : "text-muted"}`}>{s}</span>
            {i < steps.length - 1 && (
              <span className="h-0.5 flex-1 rounded-full bg-[var(--border)] overflow-hidden min-w-4">
                <motion.span className="block h-full bg-[var(--accent)]" initial={false}
                  animate={{ width: done ? "100%" : "0%" }} transition={{ duration: reduce ? 0 : 0.4 }} />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
