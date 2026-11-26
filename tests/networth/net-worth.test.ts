import { describe, it, expect } from "vitest";
import { netWorth } from "@/lib/net-worth";

describe("N-01 patrimônio líquido inclui empréstimos e investimentos", () => {
  it("usa os números reais de 26/11/2026", () => {
    const r = netWorth({
      accounts: [
        { type: "BANK", balance: 673.49 }, { type: "BANK", balance: 0.07 }, { type: "BANK", balance: 0 },
        { type: "CREDIT", balance: 2948.78 }, { type: "CREDIT", balance: 280.9 },
      ],
      investments: [{ balance: 1686.32 }, { balance: 150.14 }, { balance: 102.12 }, { balance: 41.32 }, { balance: 26.42 }, { balance: 21.48 }, { balance: 0 }],
      loans: [{ outstanding_balance: 29988.17 }, { outstanding_balance: 19456.76 }, { outstanding_balance: 0 }],
    });
    expect(r.cash).toBeCloseTo(673.56, 2);
    expect(r.investments).toBeCloseTo(2027.8, 2);
    expect(r.cards).toBeCloseTo(3229.68, 2);
    expect(r.loans).toBeCloseTo(49444.93, 2);
    expect(r.assets).toBeCloseTo(2701.36, 2);
    expect(r.debts).toBeCloseTo(52674.61, 2);
    expect(r.net).toBeCloseTo(-49973.25, 2);
  });
  it("fatura de cartão com saldo negativo conta pelo valor absoluto", () => {
    expect(netWorth({ accounts: [{ type: "credit", balance: -100 }], investments: [], loans: [] }).cards).toBe(100);
  });
});
