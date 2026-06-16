// ─────────────────────────────────────────────────────────────
// Lumina — dados mockados realistas (substituir por Pluggy API)
// ─────────────────────────────────────────────────────────────

export type AccountType = "checking" | "savings" | "credit" | "investment" | "loan";
export type ConnStatus = "updated" | "unstable" | "expired";

export interface Institution {
  id: string;
  name: string;
  color: string;
  emoji: string;
  status: ConnStatus;
  lastSyncAt: string;
  accounts: number;
}

export const institutions: Institution[] = [
  { id: "nubank", name: "Nubank", color: "#820AD1", emoji: "💜", status: "updated", lastSyncAt: "2026-06-16T11:40:00", accounts: 2 },
  { id: "itau", name: "Itaú", color: "#EC7000", emoji: "🟠", status: "updated", lastSyncAt: "2026-06-16T10:05:00", accounts: 2 },
  { id: "inter", name: "Inter", color: "#FF7A00", emoji: "🟧", status: "unstable", lastSyncAt: "2026-06-15T22:10:00", accounts: 1 },
  { id: "c6", name: "C6 Bank", color: "#242424", emoji: "⬛", status: "updated", lastSyncAt: "2026-06-16T09:30:00", accounts: 1 },
  { id: "xp", name: "XP Investimentos", color: "#0F0F0F", emoji: "📈", status: "expired", lastSyncAt: "2026-06-09T08:00:00", accounts: 1 },
];

export interface Account {
  id: string;
  institutionId: string;
  type: AccountType;
  name: string;
  balance: number;
  creditLimit?: number;
  creditUsed?: number;
  currency: string;
  lastSyncAt: string;
}

export const accounts: Account[] = [
  { id: "nu-cc", institutionId: "nubank", type: "checking", name: "Conta do Nubank", balance: 4820.55, currency: "BRL", lastSyncAt: "2026-06-16T11:40:00" },
  { id: "nu-card", institutionId: "nubank", type: "credit", name: "Cartão Nubank", balance: 0, creditLimit: 12000, creditUsed: 3240.18, currency: "BRL", lastSyncAt: "2026-06-16T11:40:00" },
  { id: "itau-cc", institutionId: "itau", type: "checking", name: "Conta Corrente Itaú", balance: 9210.0, currency: "BRL", lastSyncAt: "2026-06-16T10:05:00" },
  { id: "itau-card", institutionId: "itau", type: "credit", name: "Cartão Itaú Click", balance: 0, creditLimit: 18000, creditUsed: 5120.42, currency: "BRL", lastSyncAt: "2026-06-16T10:05:00" },
  { id: "inter-poup", institutionId: "inter", type: "savings", name: "Poupança Inter", balance: 15300.0, currency: "BRL", lastSyncAt: "2026-06-15T22:10:00" },
  { id: "c6-card", institutionId: "c6", type: "credit", name: "Cartão C6 Carbon", balance: 0, creditLimit: 25000, creditUsed: 1890.9, currency: "BRL", lastSyncAt: "2026-06-16T09:30:00" },
  { id: "xp-inv", institutionId: "xp", type: "investment", name: "Carteira XP", balance: 86400.0, currency: "BRL", lastSyncAt: "2026-06-09T08:00:00" },
  { id: "wallet", institutionId: "manual", type: "checking", name: "Carteira (dinheiro)", balance: 320.0, currency: "BRL", lastSyncAt: "2026-06-16T08:00:00" },
];

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
  parentId?: string;
  monthlyLimit?: number;
  type: "expense" | "income";
}

export const categories: Category[] = [
  { id: "moradia", name: "Moradia", emoji: "🏠", color: "#2563EB", monthlyLimit: 2800, type: "expense" },
  { id: "alimentacao", name: "Alimentação", emoji: "🍽️", color: "#16A34A", monthlyLimit: 2000, type: "expense" },
  { id: "transporte", name: "Transporte", emoji: "🚗", color: "#F97316", monthlyLimit: 800, type: "expense" },
  { id: "compras", name: "Compras", emoji: "🛍️", color: "#DB2777", monthlyLimit: 1200, type: "expense" },
  { id: "servicos-digitais", name: "Serviços digitais", emoji: "📱", color: "#7C3AED", monthlyLimit: 300, type: "expense" },
  { id: "saude", name: "Saúde", emoji: "🩺", color: "#0EA5E9", monthlyLimit: 600, type: "expense" },
  { id: "lazer", name: "Lazer", emoji: "🎬", color: "#EAB308", monthlyLimit: 700, type: "expense" },
  { id: "educacao", name: "Educação", emoji: "📚", color: "#14B8A6", monthlyLimit: 500, type: "expense" },
  { id: "utilidades", name: "Utilidades", emoji: "💡", color: "#6B7280", monthlyLimit: 650, type: "expense" },
  { id: "salario", name: "Salário", emoji: "💰", color: "#16A34A", type: "income" },
  { id: "freela", name: "Freelance", emoji: "💻", color: "#22C55E", type: "income" },
];

// subcategorias (parentId aponta para a pai)
export const subcategories: Category[] = [
  { id: "supermercado", name: "Supermercado", emoji: "🛒", color: "#16A34A", parentId: "alimentacao", monthlyLimit: 1100, type: "expense" },
  { id: "restaurantes", name: "Restaurantes", emoji: "🍴", color: "#16A34A", parentId: "alimentacao", monthlyLimit: 600, type: "expense" },
  { id: "delivery", name: "Delivery", emoji: "🛵", color: "#16A34A", parentId: "alimentacao", monthlyLimit: 300, type: "expense" },
  { id: "aluguel", name: "Aluguel", emoji: "🔑", color: "#2563EB", parentId: "moradia", monthlyLimit: 2200, type: "expense" },
  { id: "condominio", name: "Condomínio", emoji: "🏢", color: "#2563EB", parentId: "moradia", monthlyLimit: 600, type: "expense" },
  { id: "streaming", name: "Streaming", emoji: "📺", color: "#7C3AED", parentId: "servicos-digitais", monthlyLimit: 150, type: "expense" },
  { id: "combustivel", name: "Combustível", emoji: "⛽", color: "#F97316", parentId: "transporte", monthlyLimit: 500, type: "expense" },
  { id: "apps-mobilidade", name: "Apps de mobilidade", emoji: "🚕", color: "#F97316", parentId: "transporte", monthlyLimit: 300, type: "expense" },
];

export const allCategories = [...categories, ...subcategories];

export function catById(id?: string): Category | undefined {
  return allCategories.find((c) => c.id === id);
}

export interface Transaction {
  id: string;
  accountId: string;
  description: string;
  amount: number; // negativo = saída
  date: string;
  categoryId: string;
  type: "debit" | "credit";
  installmentCurrent?: number;
  installmentTotal?: number;
  fx?: { currency: string; original: number };
  ignored?: boolean;
}

export const transactions: Transaction[] = [
  { id: "t1", accountId: "itau-cc", description: "Salário Empresa XYZ Ltda", amount: 12500, date: "2026-06-05", categoryId: "salario", type: "credit" },
  { id: "t2", accountId: "nu-cc", description: "Projeto freelance — design", amount: 3200, date: "2026-06-10", categoryId: "freela", type: "credit" },
  { id: "t3", accountId: "itau-cc", description: "Aluguel apartamento", amount: -2200, date: "2026-06-06", categoryId: "aluguel", type: "debit" },
  { id: "t4", accountId: "itau-cc", description: "Condomínio Edifício Aurora", amount: -580, date: "2026-06-08", categoryId: "condominio", type: "debit" },
  { id: "t5", accountId: "nu-card", description: "Pão de Açúcar", amount: -432.18, date: "2026-06-12", categoryId: "supermercado", type: "debit" },
  { id: "t6", accountId: "nu-card", description: "iFood", amount: -68.9, date: "2026-06-14", categoryId: "delivery", type: "debit" },
  { id: "t7", accountId: "nu-card", description: "Posto Shell", amount: -280.0, date: "2026-06-11", categoryId: "combustivel", type: "debit" },
  { id: "t8", accountId: "itau-card", description: "Amazon — Cadeira (3/6)", amount: -249.9, date: "2026-06-09", categoryId: "compras", type: "debit", installmentCurrent: 3, installmentTotal: 6 },
  { id: "t9", accountId: "nu-card", description: "Netflix", amount: -55.9, date: "2026-06-03", categoryId: "streaming", type: "debit" },
  { id: "t10", accountId: "nu-card", description: "Spotify", amount: -34.9, date: "2026-06-03", categoryId: "streaming", type: "debit" },
  { id: "t11", accountId: "itau-card", description: "Uber", amount: -32.5, date: "2026-06-13", categoryId: "apps-mobilidade", type: "debit" },
  { id: "t12", accountId: "c6-card", description: "Spotify USA", amount: -54.3, date: "2026-06-07", categoryId: "streaming", type: "debit", fx: { currency: "USD", original: 9.99 } },
  { id: "t13", accountId: "nu-card", description: "Drogasil", amount: -89.4, date: "2026-06-10", categoryId: "saude", type: "debit" },
  { id: "t14", accountId: "itau-card", description: "Cinemark", amount: -76.0, date: "2026-06-14", categoryId: "lazer", type: "debit" },
  { id: "t15", accountId: "nu-card", description: "Restaurante Fasano", amount: -318.0, date: "2026-06-15", categoryId: "restaurantes", type: "debit" },
  { id: "t16", accountId: "itau-cc", description: "Conta de luz — Enel", amount: -245.7, date: "2026-06-09", categoryId: "utilidades", type: "debit" },
  { id: "t17", accountId: "itau-cc", description: "Internet — Vivo Fibra", amount: -129.9, date: "2026-06-09", categoryId: "utilidades", type: "debit" },
  { id: "t18", accountId: "nu-card", description: "Carrefour", amount: -612.45, date: "2026-06-02", categoryId: "supermercado", type: "debit" },
  { id: "t19", accountId: "itau-card", description: "Curso Alura (anual)", amount: -89.0, date: "2026-06-04", categoryId: "educacao", type: "debit" },
  { id: "t20", accountId: "c6-card", description: "AliExpress — Fones (2/3)", amount: -73.3, date: "2026-06-06", categoryId: "compras", type: "debit", installmentCurrent: 2, installmentTotal: 3 },
  { id: "t21", accountId: "nu-cc", description: "Transferência PIX recebida", amount: 450, date: "2026-06-13", categoryId: "freela", type: "credit" },
  { id: "t22", accountId: "nu-card", description: "Padaria São Domingos", amount: -38.5, date: "2026-06-16", categoryId: "restaurantes", type: "debit" },
];

// Resultado líquido por mês (timeline)
export const monthlyResults = [
  { month: "2026-01", net: 1840 },
  { month: "2026-02", net: -620 },
  { month: "2026-03", net: 2310 },
  { month: "2026-04", net: 980 },
  { month: "2026-05", net: 3120 },
  { month: "2026-06", net: 4860 },
];

// Gasto acumulado diário do mês atual vs limite
export const spendLimit = 9000;
export const dailySpend = [
  { day: 1, acc: 0 }, { day: 2, acc: 612 }, { day: 3, acc: 703 }, { day: 4, acc: 792 },
  { day: 5, acc: 792 }, { day: 6, acc: 3572 }, { day: 7, acc: 3626 }, { day: 8, acc: 4206 },
  { day: 9, acc: 4870 }, { day: 10, acc: 5028 }, { day: 11, acc: 5308 }, { day: 12, acc: 5740 },
  { day: 13, acc: 5805 }, { day: 14, acc: 5950 }, { day: 15, acc: 6268 }, { day: 16, acc: 6307 },
];

export const insights = [
  { id: "i1", icon: "⚠️", text: "Você está a R$ 2.693 do seu limite mensal de gastos.", tone: "warn", href: "/cashflow" },
  { id: "i2", icon: "🍽️", text: "Gastou R$ 240 a mais em Alimentação vs. mês passado.", tone: "danger", href: "/transactions" },
  { id: "i3", icon: "📅", text: "Você tem 3 contas recorrentes vencendo essa semana.", tone: "brand", href: "/recurring" },
  { id: "i4", icon: "💡", text: "Cadastre receitas recorrentes para projeção mais precisa.", tone: "neutral", href: "/projection" },
];

export interface RecurringRule {
  id: string;
  name: string;
  emoji: string;
  amount: number;
  frequency: "Mensal" | "Anual";
  nextDueDate: string;
  categoryId: string;
  institutionId: string;
  kind: "fixed" | "installment";
  installmentCurrent?: number;
  installmentTotal?: number;
}

export const recurring: RecurringRule[] = [
  { id: "r1", name: "Aluguel", emoji: "🔑", amount: 2200, frequency: "Mensal", nextDueDate: "2026-06-06", categoryId: "aluguel", institutionId: "itau", kind: "fixed" },
  { id: "r2", name: "Condomínio", emoji: "🏢", amount: 580, frequency: "Mensal", nextDueDate: "2026-06-08", categoryId: "condominio", institutionId: "itau", kind: "fixed" },
  { id: "r3", name: "Netflix", emoji: "📺", amount: 55.9, frequency: "Mensal", nextDueDate: "2026-06-22", categoryId: "streaming", institutionId: "nubank", kind: "fixed" },
  { id: "r4", name: "Spotify", emoji: "🎵", amount: 34.9, frequency: "Mensal", nextDueDate: "2026-06-22", categoryId: "streaming", institutionId: "nubank", kind: "fixed" },
  { id: "r5", name: "Internet Vivo", emoji: "🌐", amount: 129.9, frequency: "Mensal", nextDueDate: "2026-06-16", categoryId: "utilidades", institutionId: "itau", kind: "fixed" },
  { id: "r6", name: "Amazon — Cadeira", emoji: "🪑", amount: 249.9, frequency: "Mensal", nextDueDate: "2026-06-20", categoryId: "compras", institutionId: "itau", kind: "installment", installmentCurrent: 3, installmentTotal: 6 },
  { id: "r7", name: "AliExpress — Fones", emoji: "🎧", amount: 73.3, frequency: "Mensal", nextDueDate: "2026-06-18", categoryId: "compras", institutionId: "c6", kind: "installment", installmentCurrent: 2, installmentTotal: 3 },
];

// Projeção dos próximos 6 meses (recorrentes + parcelas empilhadas)
export const recurringForecast = [
  { month: "Jun", fixed: 3000, installment: 323 },
  { month: "Jul", fixed: 3000, installment: 323 },
  { month: "Ago", fixed: 3000, installment: 250 },
  { month: "Set", fixed: 3000, installment: 0 },
  { month: "Out", fixed: 3000, installment: 0 },
  { month: "Nov", fixed: 3000, installment: 0 },
];

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  target: number;
  current: number;
  targetDate: string;
  accountId?: string;
}

export const goals: Goal[] = [
  { id: "g1", name: "Reserva de emergência", emoji: "🛟", target: 30000, current: 18400, targetDate: "2026-12-31", accountId: "inter-poup" },
  { id: "g2", name: "Viagem Europa", emoji: "✈️", target: 18000, current: 6200, targetDate: "2027-03-01" },
  { id: "g3", name: "Trocar de notebook", emoji: "💻", target: 9000, current: 7650, targetDate: "2026-08-15" },
];

// Faturas de cartão
export interface Bill {
  accountId: string;
  institutionId: string;
  cardName: string;
  total: number;
  installments: number;
  recurring: number;
  oneoff: number;
  credits: number;
  pendingForecast: number;
  closingDate: string;
  dueDate: string;
  cycleStart: string;
}

export const bills: Bill[] = [
  { accountId: "nu-card", institutionId: "nubank", cardName: "Cartão Nubank", total: 3240.18, installments: 323.2, recurring: 90.8, oneoff: 2826.18, credits: 0, pendingForecast: 145.0, closingDate: "2026-06-28", dueDate: "2026-07-05", cycleStart: "2026-05-29" },
  { accountId: "itau-card", institutionId: "itau", cardName: "Cartão Itaú Click", total: 5120.42, installments: 249.9, recurring: 89.0, oneoff: 4781.52, credits: 0, pendingForecast: 0, closingDate: "2026-06-24", dueDate: "2026-07-01", cycleStart: "2026-05-25" },
  { accountId: "c6-card", institutionId: "c6", cardName: "Cartão C6 Carbon", total: 1890.9, installments: 73.3, recurring: 54.3, oneoff: 1763.3, credits: -120, pendingForecast: 73.3, closingDate: "2026-07-02", dueDate: "2026-07-09", cycleStart: "2026-06-03" },
];

// Patrimônio
export const netWorthHistory = [
  { week: "S1", value: 108200 },
  { week: "S2", value: 110400 },
  { week: "S3", value: 112900 },
  { week: "S4", value: 115700 },
];

export const assets = [
  { id: "a1", group: "Caixa", name: "Contas + Carteira", value: 14350.55, weight: 0.122, color: "#2563EB" },
  { id: "a2", group: "Renda Fixa", name: "Tesouro + CDB (XP)", value: 52400, weight: 0.444, color: "#16A34A" },
  { id: "a3", group: "Fundos", name: "Fundos multimercado", value: 34000, weight: 0.288, color: "#7C3AED" },
  { id: "a4", group: "Poupança", name: "Poupança Inter", value: 15300, weight: 0.13, color: "#F97316" },
];

export const debts = [
  { id: "d1", name: "Financiamento veículo (Itaú)", contract: "0042-1199", paid: 28, total: 48, status: "Em dia", balance: 31200 },
  { id: "d2", name: "Empréstimo pessoal (Inter)", contract: "EP-7781", paid: 6, total: 24, status: "Em dia", balance: 9800 },
];

// Projeção de saldo (12 meses)
export const projection = [
  { month: "Jun", income: 12500, recurring: -3000, installments: -323, daily: -2400, toConfirm: -300, balance: 9210 },
  { month: "Jul", income: 12500, recurring: -3000, installments: -323, daily: -2400, toConfirm: -300, balance: 15687 },
  { month: "Ago", income: 12500, recurring: -3000, installments: -250, daily: -2400, toConfirm: -300, balance: 22237 },
  { month: "Set", income: 12500, recurring: -3000, installments: 0, daily: -2400, toConfirm: -300, balance: 29037 },
  { month: "Out", income: 12500, recurring: -3000, installments: 0, daily: -2400, toConfirm: -300, balance: 35837 },
  { month: "Nov", income: 12500, recurring: -3000, installments: 0, daily: -2400, toConfirm: -300, balance: 42637 },
];

// ── Helpers de agregação para o mês atual ──
export const CURRENT_MONTH = "2026-06";

export function currentMonthTx() {
  return transactions.filter((t) => t.date.startsWith(CURRENT_MONTH) && !t.ignored);
}
export function totalIncome() {
  return currentMonthTx().filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
}
export function totalExpense() {
  return currentMonthTx().filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
}
export function spendByParentCategory() {
  const map = new Map<string, number>();
  for (const t of currentMonthTx()) {
    if (t.amount >= 0) continue;
    const cat = catById(t.categoryId);
    const parentId = cat?.parentId ?? cat?.id ?? "outros";
    map.set(parentId, (map.get(parentId) ?? 0) + Math.abs(t.amount));
  }
  return Array.from(map.entries())
    .map(([id, value]) => {
      const c = catById(id);
      return { id, name: c?.name ?? "Outros", emoji: c?.emoji ?? "📁", color: c?.color ?? "#6B7280", value, limit: c?.monthlyLimit };
    })
    .sort((a, b) => b.value - a.value);
}
export function totalAssets() {
  return assets.reduce((s, a) => s + a.value, 0);
}
export function totalDebts() {
  return debts.reduce((s, d) => s + d.balance, 0);
}
