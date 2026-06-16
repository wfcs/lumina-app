import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  positive: "bg-[var(--mint)]/12 text-[var(--mint)] border-[var(--mint)]/20",
  danger: "bg-danger/12 text-danger border-danger/20",
  warn: "bg-warn/12 text-warn border-warn/20",
  brand: "bg-[var(--accent)]/12 text-[var(--accent)] border-[var(--accent)]/25",
  neutral: "bg-white/[0.04] text-muted border-[var(--border)]",
};

export function Badge({ tone = "neutral", children, className }: { tone?: keyof typeof tones; children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border", tones[tone], className)}>{children}</span>;
}
