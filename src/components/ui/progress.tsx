import { cn } from "@/lib/utils";

export function Progress({ value, max = 100, className }: { value: number; max?: number; className?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const bg = pct < 70
    ? "linear-gradient(90deg, var(--accent), var(--mint))"
    : pct <= 100 ? "linear-gradient(90deg, #FFB020, #FF8A3D)"
    : "linear-gradient(90deg, #F0839F, #FF3B5C)";
  return (
    <div className={cn("h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden", className)}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%`, background: bg }} />
    </div>
  );
}
