import { describe, it, expect } from "vitest";
import { monthSummary, isCardPayment, monthsAvailable } from "@/lib/month-summary";

const types = new Map([["bank", "BANK"], ["card", "CREDIT"]]);
const tx = (account_id: string, date: string, amount: number, description: string) => ({ account_id, date, amount, description });

describe("V-01 resumo do mês sem contar pagamento de fatura", () => {
  const list = [
    tx("bank", "2026-11-05", 5000, "Salário"),
    tx("bank", "2026-11-10", -300, "Pix mercado"),
    tx("card", "2026-11-12", -200, "Compra loja"),
    tx("bank", "2026-11-16", -1138.35, "Pagamento de fatura"),
    tx("card", "2026-11-16", 1138.35, "Pagamento recebido"),
    tx("bank", "2026-11-18", -283.5, "Pagamento de fatura Fatura Paga Itau Mul"),
    tx("card", "2026-11-18", 283.5, "PAGAMENTO COM SALDO"),
    tx("bank", "2026-10-30", -50, "Outubro"),
    tx("card", "2027-01-10", -99, "Parcela futura 3/10"),
  ];
  it("soma entradas e saídas do mês, sem os pagamentos de fatura", () => {
    const r = monthSummary(list, types, "2026-11");
    expect(r.income).toBeCloseTo(5000, 2);
    expect(r.expense).toBeCloseTo(500, 2);
    expect(r.net).toBeCloseTo(4500, 2);
    expect(r.internal).toBeCloseTo(1421.85, 2);
  });
  it("reconhece pagamento de fatura pelos dois lados", () => {
    expect(isCardPayment(tx("bank", "", -10, "Pagamento de fatura"), "BANK")).toBe(true);
    expect(isCardPayment(tx("card", "", 10, "Pagamento recebido"), "CREDIT")).toBe(true);
    expect(isCardPayment(tx("bank", "", -10, "FATURA PAGA ITAU MULTIPL"), "BANK")).toBe(true);
    expect(isCardPayment(tx("bank", "", 10, "Pagamento recebido"), "BANK")).toBe(false);
    expect(isCardPayment(tx("card", "", -10, "Compra"), "CREDIT")).toBe(false);
  });
  it("lista meses do mais recente ao mais antigo, até o mês atual", () => {
    expect(monthsAvailable(list, "2026-11")).toEqual(["2026-11", "2026-10"]);
  });
});
