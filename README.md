# Lumina — Clareza Financeira

![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres%20%2B%20RLS-3ECF8E.svg)
![Deploy](https://img.shields.io/badge/deploy-Vercel-black.svg)
![Status](https://img.shields.io/badge/status-em%20desenvolvimento-8332AC.svg)

**Lumina** é um app web de gestão financeira pessoal que dá **clareza financeira** consolidando dados bancários do usuário — via **importação de extrato (OFX/CSV)** ou **Open Finance**. Visual premium "Obsidian Bloom" (roxo/violeta/menta sobre carbono).

> Preview: https://lumina-app-chi-olive.vercel.app

---

## Sumário
- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Fluxo de acesso](#fluxo-de-acesso)
- [Telas](#telas)
- [Fontes de dados](#fontes-de-dados)
- [Banco de dados](#banco-de-dados-supabase)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Início rápido](#início-rápido)
- [Deploy](#deploy)
- [Roadmap](#roadmap)

---

## Funcionalidades

### Identidade & acesso
- Login social: **Google, Microsoft (Azure) e Discord** (Supabase Auth)
- **CPF/CNPJ obrigatório e único** por conta, com validação de dígitos (cliente + Postgres) e imutável após cadastro
- **Trial de 3 dias** automático; depois exige plano (Pro/Premium) ou **token de extensão**
- **Painel admin** (`/admin`, restrito) para gerar tokens de acesso com validade em dias
- Proteção de rotas via middleware + RLS no banco

### Dados financeiros
- **Importação de extrato OFX/CSV** (qualquer banco, grátis, isolado por usuário)
- **Open Finance via Banco MCP** (hoje restrito ao admin — ver nota em Fontes de dados)
- Sincronização para o Supabase; categorias traduzidas para **pt-BR**
- Detecção automática de **recorrências** a partir das transações

### Painel & análise (dados reais)
- Visão geral: gasto do mês (dia 1→hoje), resultado e razão Gasto/Receita c/ variação, distribuição por categoria (top 10), patrimônio, transações recentes
- Transações, Fluxo de Caixa, Categorias e Recorrentes derivados das transações reais
- Ocultar valores (👁), modo escuro/claro, responsivo
- **Feedback in-app** (widget flutuante → tabela `feedback`)

---

## Stack
| Camada | Tecnologia |
|--------|-----------|
| Framework | **Next.js 14** (App Router) + **TypeScript** |
| Estilo | **Tailwind CSS** custom · **lucide-react** · marca/ícone próprios (SVG) |
| Gráficos / motion | **Recharts** · **framer-motion** |
| Estado / dados | **Zustand** · **TanStack Query** |
| Auth + DB | **Supabase** (Auth, Postgres, RLS) via `@supabase/ssr` |
| Open Finance | **Banco MCP** (mcp.ai) — REST sobre Pluggy |
| Deploy | **Vercel** |

---

## Fluxo de acesso
```
/login → /onboarding (CPF/CNPJ) → [trial/plano] → /connect (fonte de dados) → /  (dashboard)
```
O `middleware.ts` aplica os portões em ordem: sessão → CPF/CNPJ → trial/plano (`/upgrade` se expirado) → fonte conectada (`/connect`).

---

## Telas
| Rota | Estado |
|------|--------|
| `/login` `/onboarding` `/connect` `/upgrade` `/admin` | Auth, identidade, conexão, paywall, admin |
| `/` Visão Geral · `/transactions` · `/cashflow` · `/categories` · `/recurring` · `/accounts` | **Dados reais** |
| `/bills` · `/projection` · `/goals` · `/portfolio` | Exemplo (com aviso) — pendentes de fonte real |
| `/profile` | Perfil, plano, indicação |

---

## Fontes de dados
- **OFX/CSV** — caminho recomendado para qualquer usuário hoje: extrato real, isolado por usuário (RLS), sem custo.
- **Open Finance (Banco MCP)** — **single-tenant**: a API do Banco MCP lê sempre os dados do dono do workspace, não isola por usuário final. Por isso fica **restrito ao admin** (`OPENFINANCE_ALLOWED_EMAILS`). Multi-tenant real (cada usuário seu banco) exige revenda do MCP.AI ou agregador direto (Pluggy/Belvo/Klavi) — ver Roadmap.

---

## Banco de dados (Supabase)
Tabelas com **RLS** (isolamento por usuário):
- **profiles** — `tax_id` (CPF/CNPJ único), `tax_id_type`, `onboarded`, `plan`, `trial_ends_at`
- **connections / accounts / transactions** — dados sincronizados (OFX/CSV ou Open Finance)
- **feedback** — sugestões in-app
- **access_tokens** — tokens de extensão de trial (admin) · **app_admins** — admins
Funções: validação CPF/CNPJ, `redeem_access_token` (SECURITY DEFINER), `is_admin`. Advisors de segurança: sem pendências relevantes.

---

## Variáveis de ambiente
```bash
# Supabase (anon key é pública, protegida por RLS)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Banco MCP (Open Finance) — chave do painel banco.mcp.ai
BANCOMCP_API_KEY=
# (opcional) base/identidade
BANCOMCP_BASE_URL=https://api.mcp.ai

# Acesso/admin (vírgula separa e-mails)
OPENFINANCE_ALLOWED_EMAILS=
ADMIN_EMAILS=
```

---

## Início rápido
```bash
npm install
cp .env.example .env.local   # preencha as variáveis
npm run dev                  # http://localhost:3000
```
> Não rode `npm install` em pasta sincronizada (OneDrive/Dropbox) — corrompe o `node_modules`.

Teste de carga (pós-deploy): `BASE_URL=https://... k6 run scripts/loadtest.js`.

---

## Deploy
- **Vercel** ligada ao repositório (deploy automático no push da `main`); mesmas env vars no projeto.
- **Supabase** → Authentication → URL Configuration: Site URL = domínio de produção; Redirect URLs = `https://SEU-DOMINIO/**` e `http://localhost:3000/**`.
- Provedores OAuth (Google/Microsoft/Discord): ver `docs/AUTH_SETUP.md`.

---

## Roadmap
- [ ] Ligar Projeção, Patrimônio (investimentos) e Faturas aos dados reais
- [ ] Pagamento real dos planos (Stripe) + trial de 14 dias premium
- [ ] Open Finance multi-tenant: revenda Banco MCP **ou** agregador direto (Pluggy/Belvo/Klavi)
- [ ] Alertas de metas via WhatsApp
- [ ] Teste de carga com múltiplos usuários
- [ ] Domínio personalizado

---

## Licença
MIT.
