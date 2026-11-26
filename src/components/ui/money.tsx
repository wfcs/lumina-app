"use client";
import { useUI } from "@/lib/store";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CountUp } from "@/components/fx/count-up";

export function Money({
  value, sign, className, colorize, gradient, glow, countUp,
}: {
  value: number; sign?: boolean; className?: string;
  colorize?: boolean; gradient?: boolean; glow?: boolean;
  /** anima de 0 até o valor ao abrir a tela (React Bits · Count Up) */
  countUp?: boolean;
}) {
  const hide = useUI((s) => s.hideValues);
  const color = colorize ? (value > 0 ? "text-positive" : value < 0 ? "text-danger" : "") : "";
  return (
    <span className={cn("num whitespace-nowrap", gradient && "text-gradient", glow && "glow-num", color, className)}>
      {hide ? "••••" : countUp
        ? <CountUp to={value} format={(v) => brl(v, sign ? { sign: true } : undefined)} />
        : brl(value, sign ? { sign: true } : undefined)}
    </span>
  );
}
