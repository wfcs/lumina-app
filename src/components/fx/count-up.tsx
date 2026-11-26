"use client";
// Adaptado de React Bits — Count Up (https://reactbits.dev/text-animations/count-up).
// Diferenças: formata com uma função (R$ em pt-BR), anima só uma vez ao montar e
// respeita "reduzir movimento" e o modo ocultar valores.
import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

export function CountUp({ to, format, duration = 0.9, className }: {
  to: number; format: (v: number) => string; duration?: number; className?: string;
}) {
  const [v, setV] = useState(to);
  const first = useRef(true);
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setV(to); return; }
    const from = first.current ? 0 : v;
    first.current = false;
    const c = animate(from, to, { duration, ease: [0.33, 1, 0.68, 1], onUpdate: setV });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, duration]);
  // O valor final fica no rótulo acessível; leitores de tela não ouvem a contagem.
  return <span className={className} aria-label={format(to)}><span aria-hidden>{format(v)}</span></span>;
}
