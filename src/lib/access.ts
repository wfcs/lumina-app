// Enquanto o Banco MCP é single-tenant (workspace key), o Open Finance fica
// restrito ao(s) e-mail(s) do fundador. Testers usam OFX/CSV (isolado por RLS).
export function canUseOpenFinance(email?: string | null): boolean {
  const allowed = (process.env.OPENFINANCE_ALLOWED_EMAILS ?? "felipeatalaia.s7@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return !!email && allowed.includes(email.toLowerCase());
}

export function isAdmin(email?: string | null): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "felipeatalaia.s7@gmail.com")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}

export function hasAppAccess(p: { plan?: string | null; trial_ends_at?: string | null }): boolean {
  if (p.plan === "pro" || p.plan === "premium") return true;
  return !!p.trial_ends_at && new Date(p.trial_ends_at).getTime() > Date.now();
}
