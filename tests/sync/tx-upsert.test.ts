// F0-12 — compatibilidade: código novo rodando antes da migração ser aplicada.
import { describe, it, expect } from "vitest";
import { upsertTransactions } from "@/server/tx-upsert";

const row = { pluggy_transaction_id: "t1", amount: -1, installment_number: 1, installment_total: 2, original_description: "X", source: "import" };

function fake(errors: any[]) {
  const sent: any[][] = [];
  return {
    sent,
    from: () => ({ upsert: async (rows: any[]) => { sent.push(rows); return { error: errors.shift() ?? null }; } }),
  };
}

describe("F0-12 upsertTransactions", () => {
  it("grava com as colunas novas quando o banco já tem a migração", async () => {
    const db = fake([]);
    await upsertTransactions(db, [row]);
    expect(db.sent).toHaveLength(1);
    expect(db.sent[0][0]).toHaveProperty("installment_number", 1);
  });

  it("refaz sem as colunas novas (inclui source) se o banco ainda não as conhece (PGRST204)", async () => {
    const db = fake([{ code: "PGRST204", message: "Could not find the 'installment_number' column" }]);
    await upsertTransactions(db, [row]);
    expect(db.sent).toHaveLength(2);
    expect(db.sent[1][0]).toEqual({ pluggy_transaction_id: "t1", amount: -1 });
  });

  it("propaga outros erros", async () => {
    const db = fake([{ code: "23505", message: "duplicate" }]);
    await expect(upsertTransactions(db, [row])).rejects.toMatchObject({ code: "23505" });
  });
});
