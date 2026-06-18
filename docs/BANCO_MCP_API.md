# Banco MCP (MCP.AI) — Referência de Integração

> Salvo como documentação do projeto. Não é uma "Skill" instalável do Cowork
> (skills são read-only nesta sessão; criar/editar em Configurações → Capacidades).

## Auth (todas as chamadas)
`Authorization: Bearer sk_live_...` · `Content-Type: application/json` · método **POST**.
Resposta de sucesso: `{ "ok": true, "tool": "<id>", "result": <payload> }`.
Chave fica em `BANCOMCP_API_KEY` (env). Base: `BANCOMCP_BASE_URL` = `https://api.mcp.ai`.

## Open Finance MCP — base `https://api.mcp.ai/api/openfinance`
- `/connectors/search` { keywords[] } → result.banks[] + connect_url / connect_url_base
- `/connections/list` → result.connections[] { connector_id, connector_name, item_id, status } + add_connection_url
- `/connections/status` { item }
- `/connections/sync` { items[] }  (force sync)
- `/connections/disconnect` { item }
- `/accounts/list` { item?, type? (BANK|CREDIT) }
- `/accounts/detail` { account_ids[] } · `/accounts/balance` { account_ids[] }
- `/transactions/list` { account_id, from?, to?, page?, page_size? (≤500), search_queries[]? }
- `/transactions/category` { items:[{transaction_id, category_id}] }
- `/credit-card-bills/list` { account_id } · `/credit-card-bills/detail` { bill_ids[] }
- `/investments/list` { item?, type? } · `/investments/transactions/list` { investment_id }
- `/loans/list` { items[] } · `/categories/list`
- `/report` { message, context?, conversation? }  (reportar bug à MCP.AI)
Descoberta pública (sem auth): `/_endpoints`, `/_openapi`, `/_skill.md`.

## Multi-tenant (cada usuário do Lumina conecta o próprio banco)
Management API (base `https://app.mcp.ai`, mesma Bearer key):
- `POST /api/toolkits` cria toolkit; `POST /api/toolkits/{id}/invites` { label } cria **convite de guest**.
- O convite gera o `connect_url` (com `mi_…`) que o usuário abre para autorizar o banco dele.
- ⚠️ A definir/testar: como as leituras (`/connections/list` etc.) escopam por guest com a
  workspace key (token por guest? parâmetro?). Hoje a key cobre o contexto do próprio workspace.

## Mapeamento p/ Supabase (defensivo — confirmar no 1º retorno real)
connections → public.connections (pluggy_item_id = `bancomcp:<item_id>`)
accounts → public.accounts (pluggy_account_id = `bancomcp:<id>`)
transactions → public.transactions (pluggy_transaction_id = `bancomcp:<id>`, amount com sinal)
