// Upsert de transações tolerante à ordem de deploy: se o banco ainda não tiver as
// colunas da Fase 0 (erro PGRST204 do PostgREST), regrava sem elas.
type DB = any;

const PHASE0_COLUMNS = ["installment_number", "installment_total", "original_description", "source"] as const;

export async function upsertTransactions(supabase: DB, rows: Record<string, unknown>[]) {
  const first = await supabase.from("transactions").upsert(rows, { onConflict: "pluggy_transaction_id" });
  if (!first.error) return;
  if (first.error.code !== "PGRST204") throw first.error;

  const legacy = rows.map((r) => {
    const copy = { ...r };
    for (const c of PHASE0_COLUMNS) delete copy[c];
    return copy;
  });
  const retry = await supabase.from("transactions").upsert(legacy, { onConflict: "pluggy_transaction_id" });
  if (retry.error) throw retry.error;
}
