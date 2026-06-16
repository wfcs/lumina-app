export function brl(value: number, opts?: { sign?: boolean }) {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(value));
  if (opts?.sign) return (value < 0 ? "-" : "+") + " " + formatted;
  return (value < 0 ? "-" : "") + formatted;
}

export function pct(value: number, digits = 1) {
  const s = value > 0 ? "+" : "";
  return `${s}${value.toFixed(digits)}%`;
}

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function monthLabel(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}
