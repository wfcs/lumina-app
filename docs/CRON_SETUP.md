# Sincronização automática do Open Finance (8x/dia)

O endpoint `GET /api/cron/sync` sincroniza o Open Finance (Banco MCP) de quem tem
conexão. Protegido por `CRON_SECRET`. Agendado para **8x/dia (a cada 3h)**:
`00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00`.

Defina um `CRON_SECRET` forte no `.env.local` e na Vercel.

## Opção A — Vercel Cron (requer plano Pro)
Já incluído no `vercel.json`:
```json
{ "crons": [ { "path": "/api/cron/sync", "schedule": "0 */3 * * *" } ] }
```
A Vercel envia `Authorization: Bearer <CRON_SECRET>` automaticamente quando o
`CRON_SECRET` existe no projeto. **No plano Hobby (grátis) o cron roda só 1x/dia** —
para 8x/dia é preciso o Pro, ou use a Opção B/C.

## Opção B — Supabase Cron (grátis, recomendado)
No Supabase → Integrations → Cron (ou SQL), agende:
```sql
select cron.schedule(
  'lumina-openfinance-sync', '0 */3 * * *',
  $$ select net.http_get(
       url := 'https://SEU-DOMINIO/api/cron/sync?secret=SEU_CRON_SECRET'
     ); $$
);
```
Requer as extensões `pg_cron` e `pg_net` habilitadas (Database → Extensions).

## Opção C — Cron externo grátis (cron-job.org, GitHub Actions)
Agende um GET a cada 3h para:
`https://SEU-DOMINIO/api/cron/sync?secret=SEU_CRON_SECRET`

## Observações
- Hoje o Open Finance é single-tenant (Banco MCP), então o cron atualiza a conexão do fundador.
- Respeita o rate limit do Banco MCP (2 req/s); 8x/dia com poucos bancos é tranquilo.
- Retorna JSON com contagem de contas/transações sincronizadas e erros.
