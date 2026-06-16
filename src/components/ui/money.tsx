"use client";
import { useUI } from "@/lib/store";
import { brl } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Money({
  value, sign, className, colorize, gradient, glow,
}: {
  value: number; sign?: boolean; className?: string;
  colorize?: boolean; gradient?: boolean; glow?: boolean;
}) {
  const hide = useUI((s) => s.hideValues);
  const color = colorize ? (value > 0 ? "text-positive" : value < 0 ? "text-danger" : "") : "";
  return (
    <span className={cn("num", gradient && "text-gradient", glow && "glow-num", color, className)}>
      {hide ? "••••" : brl(value, sign ? { sign: true } : undefined)}
    </span>
  );
}
