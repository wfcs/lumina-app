import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const MIGRATION = join(__dirname, "..", "..", "supabase", "migrations", "20261108120000_fase0_modelo_dados.sql");
const BASELINE = join(__dirname, "baseline.sql");

export const USER_A = "00000000-0000-0000-0000-00000000000a";
export const USER_B = "00000000-0000-0000-0000-00000000000b";

/** Postgres em memória com a base atual + migração da Fase 0 aplicada `times` vezes. */
export async function freshDb(times = 1): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(readFileSync(BASELINE, "utf8"));
  const sql = readFileSync(MIGRATION, "utf8");
  for (let i = 0; i < times; i++) await db.exec(sql);
  await db.exec(`insert into auth.users(id) values ('${USER_A}'), ('${USER_B}');`);
  return db;
}

/** Executa `fn` como usuário autenticado (RLS ativo), dentro de uma transação. */
export async function asUser<T>(db: PGlite, userId: string, fn: () => Promise<T>): Promise<T> {
  await db.exec(`begin; set local role authenticated; select set_config('request.jwt.claim.sub', '${userId}', true);`);
  try {
    return await fn();
  } finally {
    await db.exec("rollback;");
  }
}

export async function one<T = any>(db: PGlite, sql: string, params: unknown[] = []): Promise<T> {
  const r = await db.query<T>(sql, params);
  return r.rows[0];
}
