"use client";
// Adaptado de React Bits — Spotlight Card (https://reactbits.dev/components/spotlight-card).
// Uma única escuta global move a luz (--mx/--my) no cartão sob o ponteiro.
// Vale para cartões clicáveis: <a class="card"> ou .card.spotlight. Visual em globals.css.
import { useEffect } from "react";

export function SpotlightLayer() {
  useEffect(() => {
    if (window.matchMedia?.("(hover: none)").matches) return; // toque: sem efeito
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = (e.target as Element | null)?.closest?.("a.card, .card.spotlight") as HTMLElement | null;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${e.clientX - r.left}px`);
        el.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => { window.removeEventListener("pointermove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return null;
}
