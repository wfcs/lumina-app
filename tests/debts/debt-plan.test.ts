import { describe, it, expect } from "vitest";
import { pricePmt, buildDebtPlan, type RankItem } from "@/lib/debt-plan";
type LoanRank = Extract<RankItem, { kind: "loan" }>;
import { mapLoan } from "@/server/mappers";

const TODAY = "2026-11-26";
const loans = [
  { id: "a", name: "Refin …302", outstanding_balance: 19456.76, rate: 0.0353, installments_total: 24, installments_paid: 7, installment_amount: 0, due_date: "2028-07-26" },
  { id: "b", name: "Refin …374", outstanding_balance: 29988.17, rate: 0.0473, installments_total: 24, installments_paid: 0, installment_amount: 0, due_date: "2028-11-26" },
  { id: "c", name: "Quitado …584", outstanding_balance: 0, rate: 0.0473, installments_total: 3, installments_paid: 3, installment_amount: 0, due_date: "2026-12-26" },
];
const cards = [
  { id: "n", institution: "Nubank", used: 2903.88, limit: 4174.23 },
  { id: "i", institution: "Itaú", used: 261, limit: 450 },
];
const bills = [
  { account_id: "n", due_date: "2026-11-23", total_amount: 1138.35, status: "closed" },
  { account_id: "n", due_date: "2026-10-21", total_amount: 357.2, status: "paid" },
  { account_id: "i", due_date: "2026-11-26", total_amount: 283.5, status: "closed" },
  { account_id: "i", due_date: "2026-10-26", total_amount: 225.83, status: "paid" },
];

describe("D-01 pricePmt (tabela Price)", () => {
  it("parcela = PV·i / (1 − (1+i)^−n)", () => {
    expect(pricePmt(29988.17, 0.0473, 24)).toBeCloseTo(2116.6, 0);
    expect(pricePmt(19456.76, 0.0353, 17)).toBeCloseTo(1541.6, 0);
  });
  it("taxa zero divide o saldo; sem parcelas restantes = 0", () => {
    expect(pricePmt(1200, 0, 12)).toBe(100);
    expect(pricePmt(1000, 0.02, 0)).toBe(0);
  });
});

describe("D-02 buildDebtPlan", () => {
  const plan = buildDebtPlan({ loans, cards, bills, today: TODAY });

  it("KPIs: total devido, juros, custo médio ponderado, parcelas e faturas a confirmar", () => {
    expect(plan.kpis.loanBalance).toBeCloseTo(49444.93, 2);
    expect(plan.kpis.billsToConfirm).toBeCloseTo(1421.85, 2);
    expect(plan.kpis.totalOwed).toBeCloseTo(50866.78, 2);
    expect(plan.kpis.monthlyInterest).toBeCloseTo(2105.26, 1);
    expect(plan.kpis.avgRate).toBeCloseTo(2105.26 / 49444.93, 5); // ponderado pelo saldo, não média simples
    expect(plan.kpis.monthlyInstallments).toBeCloseTo(3658.2, 0);
    expect(plan.kpis.billsToConfirmCount).toBe(2);
    expect(plan.kpis.lastDueDate).toBe("2028-11-26");
  });

  it("ordem: faturas a confirmar primeiro, depois empréstimos por taxa (avalanche)", () => {
    expect(plan.ranking.map((r) => r.kind)).toEqual(["bills", "loan", "loan"]);
    expect((plan.ranking[1] as LoanRank).loanId).toBe("b");
    expect((plan.ranking[2] as LoanRank).loanId).toBe("a");
    expect(plan.ranking[1].action).toBe("amortizar");
    expect(plan.ranking[2].action).toBe("em_dia");
  });

  it("participação nos juros fecha 100% e economia por R$ 1.000", () => {
    const [, b, a] = plan.ranking as LoanRank[];
    expect(b.interestShare + a.interestShare).toBeCloseTo(1, 6);
    expect(b.interestShare).toBeCloseTo(0.674, 3);
    expect(b.savingPer1000).toBeCloseTo(47.3, 2);
  });

  it("empréstimos ativos com parcela estimada; quitados separados", () => {
    expect(plan.activeLoans.map((l) => l.id)).toEqual(["b", "a"]);
    expect(plan.activeLoans[0].installmentEstimated).toBe(true);
    expect(plan.paidOffLoans.map((l) => l.id)).toEqual(["c"]);
  });

  it("parcela informada pelo banco (> 0) é usada sem estimar", () => {
    const p = buildDebtPlan({ loans: [{ ...loans[0], installment_amount: 1500 }], cards: [], bills: [], today: TODAY });
    expect(p.activeLoans[0].installment).toBe(1500);
    expect(p.activeLoans[0].installmentEstimated).toBe(false);
  });

  it("cartões: uso do limite e última fatura; alerta só acima de 80%", () => {
    expect(plan.cards[0]).toMatchObject({ id: "n", lastBill: { total_amount: 1138.35 } });
    expect(plan.cards[0].utilization).toBeCloseTo(0.6957, 4);
    expect(plan.cards[0].alert).toBe(false);
    const hot = buildDebtPlan({ loans: [], cards: [{ id: "x", institution: "X", used: 900, limit: 1000 }], bills: [], today: TODAY });
    expect(hot.cards[0].alert).toBe(true);
  });

  it("só a fatura mais recente de cada cartão entra; fatura paga não entra", () => {
    const p = buildDebtPlan({ loans: [], cards, bills: bills.map((b) => ({ ...b, status: "paid" })), today: TODAY });
    expect(p.ranking).toEqual([]);
    expect(p.kpis.billsToConfirm).toBe(0);
  });

  it("fatura aberta com vencimento futuro vira 'pagar total no vencimento'", () => {
    const p = buildDebtPlan({ loans: [], cards, bills: [{ account_id: "n", due_date: "2026-12-21", total_amount: 500, status: "open" }], today: TODAY });
    expect(p.ranking[0]).toMatchObject({ kind: "bills", action: "pagar_total" });
    expect(p.kpis.billsToConfirmCount).toBe(0);
  });

  it("sem dívidas: plano vazio sem NaN", () => {
    const p = buildDebtPlan({ loans: [], cards: [], bills: [], today: TODAY });
    expect(p.kpis.avgRate).toBe(0);
    expect(p.ranking).toEqual([]);
  });
});

describe("D-03 nome do contrato só com dígitos finais", () => {
  it("mapLoan acrescenta …NNN do número do contrato", () => {
    expect(mapLoan({ id: "z", productName: "CREDITO ECONSIGNADO REFIN ITAU", contractNumber: "000003330662374" }).name)
      .toBe("CREDITO ECONSIGNADO REFIN ITAU …374");
  });
});
