# Lumina — Clareza Financeira com Open Finance

![Version](https://img.shields.io/badge/version-0.1.0-8332AC.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres-3ECF8E.svg)
![Deploy](https://img.shields.io/badge/deploy-Vercel-black.svg)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-F4B860.svg)

**Lumina** é um app web de gestão financeira pessoal integrado ao **Open Finance brasileiro** (via Pluggy), que consolida contas de múltiplas instituições em uma única interface para oferecer **clareza financeira**.

> App em produção (preview): https://lumina-app-chi-olive.vercel.app

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Fluxo de acesso](#fluxo-de-acesso)
- [Telas](#telas)
- [Design System](#design-system)
- [Banco de dados](#banco-de-dados-supabase)
- [Início rápido](#início-rápido)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Deploy](#deploy)
- [Roadmap](#roadmap)
- [Licença](#licença)

---

## Funcionalidades

### Autenticação e identidade
- Login social: **Google, Microsoft (Azure) e Discord** (Supabase Auth)
- **CPF/CNPJ obrigatório** após o login, com validação de dígitos verificadores (cliente + Postgres)
- CPF/CNPJ **único por conta** (não permite duas contas com o mesmo documento) e imutável após cadastro
- Proteção de rotas por middleware (sessão via `@supabase/ssr`) e RLS no banco

### Open Finance (Pluggy)
- Conexão de bancos via **Pluggy Connect Widget** (sandbox e produção)
- Sincronização de contas e transações para o Supabase (`/api/pluggy/sync`)
- Gate de onboarding: o painel só libera após conectar ≥1 instituição
- Suporte a contas correntes, poupança, cartões, investimentos e empréstimos

### Painel e análise
- Visão geral com gasto vs. limite, distribuição por categoria e insights
- Fluxo de caixa, projeção de saldo, patrimônio (ativos − dívidas)
- Faturas com ciclos de faturamento; categorias hierárquicas com limites
- Ocultação global de valores, modo escuro e layout responsivo

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | **Next.js 14** (App Router) + **TypeScript** |
| Estilo | **Tailwind CSS** (design system custom) · **lucide-react** |
| Gráficos / motion | **Recharts** · **framer-motion** |
| Estado / dados | **Zustand** · **TanStack Query** |
| Auth + DB | **Supabase** (Auth, Postgres, RLS) via `@supabase/ssr` |
| Open Finance | **Pluggy** (`react-pluggy-connect` + REST API) |
| Deploy | **Vercel** (frontend + rotas/edge) |

---

## Fluxo de acesso

```
/login  →  /onboarding (CPF/CNPJ)  →  /connect (banco via Open Finance)  →  /  (dashboard)
```

O `middleware.ts` aplica os três portões em ordem: sem sessão → `/login`; sem CPF/CNPJ → `/onboarding`; sem banco conectado → `/connect`.

---

## Telas

| Rota | Módulo |
|------|--------|
| `/login` | Login social (Google / Microsoft / Discord) |
| `/onboarding` | Cadastro e validação de CPF/CNPJ |
| `/connect` | Conexão de banco via Pluggy (Open Finance) |
| `/` | Visão Geral (gasto vs. limite, donut, faturas, metas, patrimônio) |
| `/transactions` | Transações (timeline, tabela, busca, parcelas, câmbio) |
| `/recurring` | Recorrentes (parcelas, contas fixas, forecast) |
| `/cashflow` | Fluxo de Caixa |
| `/accounts` | Contas, cartões e conexões |
| `/bills` | Faturas e ciclos |
| `/categories` | Categorias, tags e automações |
| `/goals` | Metas |
| `/projection` | Projeção de saldo |
| `/portfolio` | Patrimônio (ativos/dívidas) |
| `/profile` | Perfil, plano e indicação |

> Observação: dashboard e telas internas usam dados de exemplo até a primeira sincronização real da Pluggy estar validada (ver Roadmap).

---

## Design System

Estética **Obsidian Bloom** — fintech premium sobre base carbono:

| Papel | Cor |
|-------|-----|
| Primário (Indigo Bloom) | `#8332AC` |
| Acento (Violet) | `#E086D3` |
| Positivo / dinheiro (Celadon) | `#B8EBD0` |
| Destaque (Almond Silk) | `#F2D1C9` |
| Base (Carbon Black) | `#191919` |

Tipografia: **Space Grotesk** (números/display) + **Manrope** (corpo). Tudo via CSS variables, com modo claro derivado da mesma paleta.

---

## Banco de dados (Supabase)

Tabelas com **RLS** (cada usuário só acessa os próprios dados):

- **profiles** — `id` (→ `auth.users`), `tax_id` (CPF/CNPJ, único), `tax_id_type`, `onboarded`. Funções `is_valid_cpf` / `is_valid_cnpj` + triggers de validação e criação automática no signup.
- **connections** — `pluggy_item_id`, instituição, `status`, `last_sync_at`.
- **accounts** — `pluggy_account_id`, tipo, `balance`, `credit_limit`, moeda.
- **transactions** — `pluggy_transaction_id`, `amount` (com sinal), `type`, `date`, `category`.

Migrations aplicadas: `identity_profiles_cpf_cnpj`, `harden_trigger_functions_execute`, `openfinance_connections_accounts_transactions`.

---

## Início rápido

```bash
npm install
cp .env.example .env.local   # preencha as variáveis
npm run dev                  # http://localhost:3000
```

> Evite rodar `npm install` em pastas sincronizadas (OneDrive/Dropbox) — a sincronização pode corromper o `node_modules`.

---

## Variáveis de ambiente

```bash
# Supabase (a anon key é pública por design, protegida por RLS)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Pluggy (Open Finance) — credenciais do sandbox/produção em dashboard.pluggy.ai
PLUGGY_CLIENT_ID=
PLUGGY_CLIENT_SECRET=
```

Configuração dos provedores OAuth (Google/Microsoft/Discord), Site URL e Redirect URLs: ver **`docs/AUTH_SETUP.md`**.

---

## Deploy

- **Vercel** ligada ao repositório (deploy automático a cada push na `main`).
- Definir as mesmas variáveis de ambiente no projeto da Vercel.
- No Supabase → Authentication → URL Configuration: **Site URL** = domínio de produção; **Redirect URLs** = `https://SEU-DOMINIO/**` e `http://localhost:3000/**`.

---

## Roadmap

- [ ] Ligar dashboard/contas/transações aos dados reais da Pluggy (pós primeira conexão)
- [ ] Trial de 3 dias + planos Pro/Premium + token de extensão (validade configurável)
- [ ] Alertas via WhatsApp para metas de receita/gastos
- [ ] Teste de carga com múltiplos usuários simultâneos
- [ ] Domínio personalizado
- [ ] Campo de sugestões e feedback in-app
- [ ] Categorização automática (regras + LLM) e criptografia/auditoria

---

## Licença

MIT.
