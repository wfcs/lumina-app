"use client";
// Adaptado de React Bits — Animated List (https://reactbits.dev/components/animated-list).
// Linhas entram em sequência (uma vez) e as setas ↑/↓ movem o foco entre elas.
import { motion, useReducedMotion } from "framer-motion";
import { Children, useRef } from "react";

export function AnimatedList({ children, className = "", as = "div", stagger = 0.04 }: {
  children: React.ReactNode; className?: string; as?: "div" | "tbody"; stagger?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const items = Array.from(ref.current?.querySelectorAll<HTMLElement>("[data-al-item]") ?? []);
    const i = items.findIndex((el) => el.contains(document.activeElement));
    if (i < 0) return;
    const next = items[e.key === "ArrowDown" ? Math.min(i + 1, items.length - 1) : Math.max(i - 1, 0)];
    e.preventDefault();
    next.focus();
  };
  const Item = as === "tbody" ? motion.tr : motion.div;
  const Wrap = as as any;
  return (
    <Wrap ref={ref} className={className} onKeyDown={onKey}>
      {Children.toArray(children).map((child, i) => {
        const el = child as React.ReactElement<any>;
        return (
          <Item key={el.key ?? i} data-al-item tabIndex={0} {...(el.props ?? {})}
            className={`${el.props?.className ?? ""} outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60`}
            initial={reduce || i > 20 ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: Math.min(i, 20) * stagger, ease: "easeOut" }} />
        );
      })}
    </Wrap>
  );
}
