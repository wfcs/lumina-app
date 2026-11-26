// Fase 0 — modelo de dados. Testes escritos ANTES da migração (vermelho → verde).
import { describe, it, expect, beforeAll } from "vitest";
import type { PGlite } from "@electric-sql/pglite";
import { freshDb, asUser, one, USER_A, USER_B } from "./helpers";

const NEW_TABLES = [
  "user_settings", "category_budgets", "tags", "transaction_tags", "rules",
  "recurrences", "installment_plans", "card_bills", "goals", "goal_allocations",
  "investments", "debts", "patrimony_snapshots",
];

let db: PGlite;
beforeAll(async () => { db = await freshDb(); });

const d = (v: any) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v));

describe("F0-01 migração", () => {
  it("aplica sobre a base atual e é idempotente (2 execuções)", async () => {
    const twice = await freshDb(2);
    const r = await one<{ n: number }>(twice, "select count(*)::int n from pg_tables where schemaname='public'");
    expect(r.n).toBeGreaterThanOrEqual(6 + NEW_TABLES.length);
  });
});

describe("F0-02 tabelas e RLS", () => {
  it.each(NEW_TABLES)("%s existe com RLS habilitado", async (t) => {
    const r = await one<{ rls: boolean }>(db,
      "select relrowsecurity rls from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and relname=$1", [t]);
    expect(r?.rls).toBe(true);
  });
});

describe("F0-03 isolamento por usuário (RLS)", () => {
  it("usuário B não enxerga meta do usuário A", async () => {
    await asUser(db, USER_A, async () => {
      await db.query("insert into goals(user_id, name, target_amount) values ($1, 'Meta A', 1000)", [USER_A]);
      const own = await one<{ n: number }>(db, "select count(*)::int n from goals");
      expect(own.n).toBe(1);
    });
    // a transação de asUser foi desfeita; grava de novo fora do RLS e consulta como B
    await db.query("insert into goals(user_id, name, target_amount) values ($1, 'Meta A', 1000)", [USER_A]);
    await asUser(db, USER_B, async () => {
      const r = await one<{ n: number }>(db, "select count(*)::int n from goals");
      expect(r.n).toBe(0);
    });
  });

  it("usuário A não consegue gravar regra em nome do usuário B", async () => {
    await asUser(db, USER_A, async () => {
      await expect(db.query(
        "insert into rules(user_id, name, conditions, actions) values ($1, 'x', '[]', '{}')", [USER_B],
      )).rejects.toThrow(/row-level security/i);
    });
  });
});

describe("F0-04 colunas novas em tabelas existentes", () => {
  it("transactions recebe ignored/notes/original_description/parcelas/recorrência/origem/split", async () => {
    const r = await db.query<{ column_name: string }>(
      "select column_name from information_schema.columns where table_schema='public' and table_name='transactions'");
    const cols = r.rows.map((x) => x.column_name);
    for (const c of ["ignored", "notes", "original_description", "installment_number", "installment_total",
      "recurrence_id", "source", "split_parent_id", "spend_type"]) expect(cols).toContain(c);
  });

  it("defaults: ignored=false e source='openfinance'", async () => {
    const t = await one<any>(db,
      "insert into transactions(user_id, amount, date) values ($1, -10, '2026-11-08') returning ignored, source", [USER_A]);
    expect(t).toEqual({ ignored: false, source: "openfinance" });
  });

  it("parcela fora do intervalo 1..total é rejeitada", async () => {
    await expect(db.query(
      "insert into transactions(user_id, amount, date, installment_number, installment_total) values ($1,-1,'2026-11-01',7,6)",
      [USER_A])).rejects.toThrow(/check/i);
  });

  it("user_categories: kind padrão 'expense' e spend_type validado", async () => {
    const c = await one<any>(db, "insert into user_categories(user_id, name) values ($1,'Teste') returning kind", [USER_A]);
    expect(c.kind).toBe("expense");
    await expect(db.query("insert into user_categories(user_id, name, spend_type) values ($1,'X','xyz')", [USER_A]))
      .rejects.toThrow(/check/i);
  });
});

describe("F0-05 restrições de domínio", () => {
  it("user_settings: dia do ciclo 1..28 e regime competencia|caixa", async () => {
    await expect(db.query("insert into user_settings(user_id, cycle_start_day) values ($1, 29)", [USER_A])).rejects.toThrow(/check/i);
    await expect(db.query("insert into user_settings(user_id, card_regime) values ($1, 'outro')", [USER_A])).rejects.toThrow(/check/i);
    const s = await one<any>(db, "insert into user_settings(user_id) values ($1) returning cycle_start_day, card_regime", [USER_A]);
    expect(s).toEqual({ cycle_start_day: 1, card_regime: "competencia" });
  });

  it("rules: conditions precisa ser lista e actions objeto", async () => {
    await expect(db.query("insert into rules(user_id, name, conditions, actions) values ($1,'r','{}','{}')", [USER_A])).rejects.toThrow(/check/i);
    await expect(db.query("insert into rules(user_id, name, conditions, actions) values ($1,'r','[]','[]')", [USER_A])).rejects.toThrow(/check/i);
  });

  it("goals: alvo > 0 e status válido", async () => {
    await expect(db.query("insert into goals(user_id, name, target_amount) values ($1,'g',0)", [USER_A])).rejects.toThrow(/check/i);
    await expect(db.query("insert into goals(user_id, name, target_amount, status) values ($1,'g',10,'x')", [USER_A])).rejects.toThrow(/check/i);
  });

  it("tags únicas por usuário sem diferenciar maiúsculas", async () => {
    await db.query("insert into tags(user_id, name) values ($1,'Viagem')", [USER_A]);
    await expect(db.query("insert into tags(user_id, name) values ($1,'viagem')", [USER_A])).rejects.toThrow(/unique|duplicate/i);
    await db.query("insert into tags(user_id, name) values ($1,'viagem')", [USER_B]);
  });

  it("limite por categoria único por mês", async () => {
    const c = await one<any>(db, "insert into user_categories(user_id, name) values ($1,'Mercado') returning id", [USER_A]);
    await db.query("insert into category_budgets(user_id, category_id, month, limit_amount) values ($1,$2,'2026-11-01',500)", [USER_A, c.id]);
    await expect(db.query("insert into category_budgets(user_id, category_id, month, limit_amount) values ($1,$2,'2026-11-01',600)", [USER_A, c.id]))
      .rejects.toThrow(/unique|duplicate/i);
  });
});

describe("F0-06 funções de ciclo e cartão", () => {
  it.each([
    ["2026-11-08", 1, "2026-11-01", "2026-11-30"],
    ["2026-11-08", 10, "2026-10-10", "2026-11-09"],
    ["2026-11-10", 10, "2026-11-10", "2026-12-09"],
    ["2026-01-05", 15, "2025-12-15", "2026-01-14"],
  ])("cycle_bounds(%s, dia %i) = %s..%s", async (ref, day, s, e) => {
    const r = await one<any>(db, "select * from cycle_bounds($1::date, $2)", [ref, day]);
    expect([d(r.cycle_start), d(r.cycle_end)]).toEqual([s, e]);
  });

  it.each([
    ["2026-11-14", 14, "2026-11-01"], // compra no dia do fechamento entra na fatura do mês
    ["2026-11-15", 14, "2026-12-01"], // dia seguinte ao fechamento vai para a próxima
    ["2026-12-20", 14, "2027-01-01"], // virada de ano
    ["2026-11-30", 31, "2026-11-01"], // fechamento 31 em mês de 30 dias = último dia
  ])("card_bill_month(%s, fecha %i) = %s", async (p, closing, m) => {
    const r = await one<any>(db, "select card_bill_month($1::date, $2) m", [p, closing]);
    expect(d(r.m)).toBe(m);
  });

  it.each([[14, 15], [28, 29], [31, 1]])("best_purchase_day(%i) = %i", async (c, b) => {
    const r = await one<any>(db, "select best_purchase_day($1) b", [c]);
    expect(r.b).toBe(b);
  });
});

describe("F0-13 backfill de origem", () => {
  it("transação importada de extrato (id manual:) passa a ter source='import'", async () => {
    const { PGlite } = await import("@electric-sql/pglite");
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { MIGRATION } = await import("./helpers");
    const raw = new PGlite();
    await raw.exec(readFileSync(join(__dirname, "baseline.sql"), "utf8"));
    await raw.exec(`insert into auth.users(id) values ('${USER_A}');
      insert into transactions(user_id, pluggy_transaction_id, amount, date) values
        ('${USER_A}', 'manual:u:1', -5, '2026-11-01'), ('${USER_A}', 'abc', -5, '2026-11-01');`);
    await raw.exec(readFileSync(MIGRATION, "utf8"));
    const r = await raw.query<any>("select pluggy_transaction_id id, source from transactions order by 1");
    expect(r.rows).toEqual([{ id: "abc", source: "openfinance" }, { id: "manual:u:1", source: "import" }]);
  });
});
