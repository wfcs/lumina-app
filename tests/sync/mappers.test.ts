// Fase 0 — mapeadores do sync (Open Finance → tabelas novas). Testes antes do código.
import { describe, it, expect } from "vitest";
import { txExtras, mapInvestment, mapLoan, mapBill } from "@/server/mappers";
import { saveExtras } from "@/server/sync-extras";

describe("F0-07 txExtras: parcelas e descrição original", () => {
  it("usa creditCardMetadata do Pluggy", () => {
    expect(txExtras({
      description: "Locadora", descriptionRaw: "LOCADORA*XYZ",
      creditCardMetadata: { installmentNumber: 3, totalInstallments: 6 },
    })).toEqual({ installment_number: 3, installment_total: 6, original_description: "LOCADORA*XYZ" });
  });

  it("cai para o sufixo n/N da descrição quando não há metadados", () => {
    expect(txExtras({ description: "Loja 2/10" })).toMatchObject({ installment_number: 2, installment_total: 10 });
  });

  it("ignora frações inválidas (n > N, N < 2) e datas como 10/11", () => {
    expect(txExtras({ description: "Loja 7/6" })).toMatchObject({ installment_number: null, installment_total: null });
    expect(txExtras({ description: "Loja 1/1" })).toMatchObject({ installment_number: null, installment_total: null });
    expect(txExtras({ description: "Pix 10/11 Fulano" })).toMatchObject({ installment_number: null });
  });

  it("aceita formato snake_case do Banco MCP", () => {
    expect(txExtras({ description: "X", description_raw: "RAW", installment_number: 1, total_installments: 12 }))
      .toEqual({ installment_number: 1, installment_total: 12, original_description: "RAW" });
  });
});

describe("F0-08 mapInvestment", () => {
  it("Pluggy renda fixa atrelada ao CDI", () => {
    expect(mapInvestment({
      id: "inv1", name: "CDB Banco", type: "FIXED_INCOME", subtype: "CDB",
      balance: 1676.25, rate: 100, rateType: "CDI", dueDate: "2027-01-01T00:00:00.000Z",
    })).toEqual({
      provider_id: "inv1", name: "CDB Banco", type: "fixed_income", subtype: "CDB",
      balance: 1676.25, indexer: "CDI", rate: 100, due_date: "2027-01-01", source: "openfinance",
    });
  });

  it("valores ausentes viram null/0 sem quebrar", () => {
    expect(mapInvestment({ id: "x" })).toMatchObject({ name: "Investimento", type: "other", balance: 0, due_date: null });
  });
});

describe("F0-09 mapLoan", () => {
  it("Pluggy: saldo devedor, parcelas e taxa", () => {
    expect(mapLoan({
      id: "l1", productName: "Consignado", type: "PERSONAL_LOAN", outstandingBalance: 9000,
      installmentAmount: 450, installments: { totalNumberOfInstallments: 48, paidInstallments: 10 },
      interestRates: [{ preFixedRate: 0.0189 }], dueDate: "2030-05-10",
    })).toEqual({
      provider_id: "l1", name: "Consignado", type: "personal_loan", outstanding_balance: 9000,
      installment_amount: 450, installments_total: 48, installments_paid: 10,
      rate: 0.0189, due_date: "2030-05-10", source: "openfinance",
    });
  });
});

describe("F0-10 mapBill", () => {
  it("fatura do Pluggy com mês de referência = mês do vencimento", () => {
    expect(mapBill({ id: "b1", dueDate: "2026-11-21T00:00:00Z", totalAmount: 975.11, minimumPaymentAmount: 150 }))
      .toEqual({ provider_bill_id: "b1", due_date: "2026-11-21", reference_month: "2026-11-01",
        total_amount: 975.11, minimum_payment: 150 });
  });
});

describe("F0-11 saveExtras grava nas tabelas novas com user_id", () => {
  it("faz upsert de investimentos, dívidas e faturas", async () => {
    const calls: { table: string; rows: any[]; opts: any }[] = [];
    const fake = {
      from: (table: string) => ({
        upsert: async (rows: any[], opts: any) => { calls.push({ table, rows, opts }); return { error: null }; },
      }),
    };
    const n = await saveExtras(fake, "u1", "conn1", {
      investments: [{ id: "i1", name: "CDB", balance: 10 }],
      loans: [{ id: "l1", productName: "Emp", outstandingBalance: 5 }],
      bills: [{ accountId: "acc1", bill: { id: "b1", dueDate: "2026-11-21", totalAmount: 1 } }],
    });
    expect(n).toEqual({ investments: 1, debts: 1, bills: 1 });
    const byTable = Object.fromEntries(calls.map((c) => [c.table, c]));
    expect(byTable.investments.rows[0]).toMatchObject({ user_id: "u1", connection_id: "conn1", provider_id: "i1" });
    expect(byTable.investments.opts).toEqual({ onConflict: "provider_id" });
    expect(byTable.debts.rows[0]).toMatchObject({ user_id: "u1", provider_id: "l1" });
    expect(byTable.card_bills.rows[0]).toMatchObject({ user_id: "u1", account_id: "acc1", provider_bill_id: "b1" });
  });

  it("listas vazias não chamam o banco", async () => {
    let called = false;
    const fake = { from: () => ({ upsert: async () => { called = true; return { error: null }; } }) };
    expect(await saveExtras(fake, "u1", "c", { investments: [], loans: [], bills: [] }))
      .toEqual({ investments: 0, debts: 0, bills: 0 });
    expect(called).toBe(false);
  });
});

// ---- Correções do 1º sync real (22/11/2026) ----
import { flattenLoans, billStatus } from "@/server/mappers";
import { activeAccounts } from "@/lib/active-accounts";

describe("F0-12 empréstimos do Banco MCP", () => {
  it("/loans/list vem agrupado por conexão: achata e descarta itens sem id", () => {
    const resp = { results: [
      { item: "itau", total: 2, results: [{ id: "l1" }, { id: "l2" }] },
      { item: "nubank", total: 0, results: [] },
    ] };
    expect(flattenLoans(resp).map((l) => l.id)).toEqual(["l1", "l2"]);
    expect(flattenLoans({ loans: [{ id: "x" }, {}] }).map((l) => l.id)).toEqual(["x"]);
  });

  it("detalhe do contrato: saldo devedor, parcela, parcelas pagas e taxa", () => {
    expect(mapLoan({
      id: "l9", productName: "CREDITO ECONSIGNADO", type: "CREDITO_PESSOAL_COM_CONSIGNACAO",
      totalRemainingAmount: 100, nextInstallmentAmount: 812.4, contractAmount: 29942.06,
      installments: { totalNumberOfInstallments: 48, paidInstallments: 3 },
      payments: { contractOutstandingBalance: 27000.5 },
      interestRates: [{ preFixedRate: 0.0189 }], dueDate: "2028-11-26T00:00:00.000Z",
    })).toEqual({
      provider_id: "l9", name: "CREDITO ECONSIGNADO", type: "credito_pessoal_com_consignacao",
      outstanding_balance: 27000.5, installment_amount: 812.4, installments_total: 48, installments_paid: 3,
      rate: 0.0189, due_date: "2028-11-26", source: "openfinance",
    });
  });
});

describe("F0-13 status da fatura vem do payment_status", () => {
  it("mapeia PAID/OPEN/PAST_DUE_* para o domínio da tabela", () => {
    expect(billStatus("PAID")).toBe("paid");
    expect(billStatus("OPEN")).toBe("open");
    expect(billStatus("PAST_DUE_UNPAID")).toBe("overdue");
    expect(billStatus("PAST_DUE_UNCONFIRMED")).toBe("closed"); // pagamento pode não ter refletido ainda
    expect(billStatus(undefined)).toBeUndefined();
  });
  it("mapBill grava status e data de fechamento quando vierem", () => {
    expect(mapBill({ id: "b2", dueDate: "2026-10-21T00:00:00Z", billClosingDate: "2026-10-14T00:00:00Z",
      totalAmount: 357.2, payment_status: "PAID" }))
      .toMatchObject({ provider_bill_id: "b2", status: "paid", closing_date: "2026-10-14" });
  });
});

describe("F0-14 saveExtras isola falhas por tabela", () => {
  it("erro em dívidas não impede gravar faturas", async () => {
    const written: string[] = [];
    const fake = { from: (table: string) => ({ upsert: async () => {
      if (table === "debts") return { error: { message: "boom" } };
      written.push(table); return { error: null };
    } }) };
    const r = await saveExtras(fake, "u1", "c1", {
      investments: [{ id: "i1" }], loans: [{ id: "l1" }],
      bills: [{ accountId: "a1", bill: { id: "b1", dueDate: "2026-11-21", totalAmount: 1 } }],
    });
    expect(written).toEqual(["investments", "card_bills"]);
    expect(r.errors).toEqual(["debts: boom"]);
  });
});

describe("F0-15 contas de conexões desconectadas não entram nas telas", () => {
  it("filtra contas cuja conexão está 'disconnected'", () => {
    const accounts = [{ id: "a1", connection_id: "c1" }, { id: "a2", connection_id: "c2" }, { id: "a3", connection_id: null }];
    const conns = [{ id: "c1", status: "updated" }, { id: "c2", status: "disconnected" }];
    expect(activeAccounts(accounts, conns).map((a) => a.id)).toEqual(["a1", "a3"]);
  });
});
