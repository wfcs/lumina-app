import { describe, it, expect } from "vitest";
import { settleBills, settleInstallments, candidatesFor, billKey, installmentKey } from "@/lib/settle";

const tx = (id: string, date: string, amount: number, description: string) => ({ id, date, amount, description });
const bank = [
  tx("t1", "2026-11-16", -1138.35, "Pagamento de fatura"),
  tx("t2", "2026-11-18", -283.5, "Pagamento de fatura Fatura Paga Itau Mul"),
  tx("t3", "2026-11-26", -1542.61, "Saída CRED CONSIGNAD"),
  tx("t4", "2026-10-26", -1542.61, "Saída CRED CONSIGNAD"),
  tx("t5", "2026-11-17", -150, "Pagamento de fatura Fatura Paga Itau Mul"),
  tx("t6", "2026-11-20", -300, "Pix mercado"),
];
const bills = [
  { account_id: "nu", due_date: "2026-11-23", total_amount: 1138.35, status: "closed" },
  { account_id: "itau", due_date: "2026-11-25", total_amount: 283.5, status: "closed" },
];

describe("S-01 baixa automática de fatura pelo valor exato", () => {
  it("acha os pagamentos reais de 16/11 e 18/11", () => {
    const r = settleBills(bills, bank, []);
    expect(r.get(billKey(bills[0]))).toMatchObject({ settled: true, source: "auto", tx: { id: "t1" } });
    expect(r.get(billKey(bills[1]))).toMatchObject({ settled: true, source: "auto", tx: { id: "t2" } });
  });
  it("baixa manual vence a automática; recusa desliga a automática", () => {
    const manual = [{ id: "s1", kind: "bill", target_key: billKey(bills[0]), transaction_id: "t6", source: "manual", amount: 300 }];
    expect(settleBills(bills, bank, manual as any).get(billKey(bills[0]))).toMatchObject({ settled: true, source: "manual", tx: { id: "t6" } });
    const rejected = [{ id: "s2", kind: "bill", target_key: billKey(bills[0]), transaction_id: null, source: "rejected", amount: null }];
    expect(settleBills(bills, bank, rejected as any).get(billKey(bills[0]))).toMatchObject({ settled: false });
  });
  it("fora da janela (10 dias antes a 5 depois do vencimento) não baixa", () => {
    const late = [tx("x", "2026-12-05", -1138.35, "Pagamento de fatura")];
    expect(settleBills([bills[0]], late, []).get(billKey(bills[0]))).toMatchObject({ settled: false });
  });
});

describe("S-02 baixa automática da parcela do mês", () => {
  const loans = [
    { id: "L302", installment: 1541.57, due_date: "2028-07-26" },
    { id: "L374", installment: 2116.55, due_date: "2028-11-26" },
  ];
  it("parcela estimada aceita até 2% de diferença (1.542,61 vs 1.541,57)", () => {
    const r = settleInstallments(loans, bank, [], "2026-11");
    expect(r.get(installmentKey("L302", "2026-11"))).toMatchObject({ settled: true, source: "auto", tx: { id: "t3" }, due: "2026-11-26" });
    expect(r.get(installmentKey("L374", "2026-11"))).toMatchObject({ settled: false, due: "2026-11-26" });
  });
});

describe("S-03 candidatas para a baixa manual", () => {
  it("ordena pela diferença de valor, só perto do vencimento e sem repetir transação já usada", () => {
    const c = candidatesFor({ amount: 1541.57, due: "2026-11-26" }, bank, new Set(["t3"]));
    expect(c[0].id).toBe("t1");                      // 1.138,35 é a saída mais próxima em valor
    expect(c.map((t) => t.id)).not.toContain("t3");  // já usada na baixa
    expect(c.map((t) => t.id)).not.toContain("t4");  // parcela de outubro: fora da janela
  });
});
