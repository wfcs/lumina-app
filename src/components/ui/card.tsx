import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("card p-5 animate-fade-up", className)}>{children}</div>;
}
export function CardTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[11px] font-semibold text-muted uppercase tracking-[0.14em]">{children}</h3>
      {action}
    </div>
  );
}
