# Lumina — Clareza Financeira com Open Finance

![Version](https://img.shields.io/badge/version-0.1.0-8332AC.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3-38BDF8.svg)
![Status](https://img.shields.io/badge/status-prototipo-F4B860.svg)

**Lumina** e um aplicativo web de gestao financeira pessoal integrado ao **Open Finance brasileiro** (via Pluggy), que consolida dados de multiplas instituicoes em uma unica interface para oferecer **clareza financeira** ao usuario.

> Status: prototipo visual navegavel com dados mockados. A camada de integracao com a Pluggy esta estruturada (stub), pronta para receber credenciais reais.

---

## Sumario

- [Features](#features)
- [Stack](#stack)
- [Telas](#telas)
- [Design System](#design-system)
- [Inicio Rapido](#inicio-rapido)
- [Integracao Open Finance](#integracao-open-finance-pluggy)
- [Modelo de Dados](#modelo-de-dados)
- [Proximos Passos](#proximos-passos)
- [Licenca](#licenca)

---

## Features

### Open Finance (via Pluggy)
- Conexao com multiplas instituicoes (Nubank, Itau, Inter, C6, XP...)
- Status por conexao: Atualizado / Instavel / Expirado
- Suporte a contas correntes, poupanca, cartoes, investimentos e emprestimos
- Fluxo estruturado: auth -> connect token -> contas/transacoes -> webhook

### Dashboards e Analise
- Visao geral com gasto vs. limite, distribuicao por categoria e insights rotativos
- Fluxo de caixa, projecao de saldo futuro e patrimonio (ativos menos dividas)
- Faturas com ciclos de faturamento e parcelas previstas
- Categorias hierarquicas com limites, tags e automacoes

### Transversais
- Ocultacao global de valores (botao de olho)
- Modo escuro/claro
- Responsivo (tablet 768px+ e desktop)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | **Next.js 14** (App Router) + **TypeScript** |
| Estilo | **Tailwind CSS** (design system custom) |
| Icones | **lucide-react** |
| Graficos | **Recharts** |
| Animacoes | **framer-motion** |
| Estado | **Zustand** |
| Data fetching | **TanStack Query** |
| Tema | **next-themes** |
| Open Finance | **Pluggy** (pluggy.ai) |
| _Planejado_ | NextAuth, Prisma + PostgreSQL, Resend |

---

## Telas

| Rota | Modulo |
|------|--------|
| `/` | Visao Geral (insights, gasto vs. limite, donut, faturas, metas, patrimonio) |
| `/transactions` | Transacoes (timeline de meses, tabela, busca, parcelas, cambio) |
| `/recurring` | Recorrentes (despesas/receitas, parcelas, contas fixas, forecast 6m) |
| `/cashflow` | Fluxo de Caixa (resultado, receitas/gastos, "para onde foi") |
| `/accounts` | Contas (cartoes, contas bancarias, conexoes) |
| `/bills` | Faturas (ciclos de faturamento, breakdown, valores previstos) |
| `/categories` | Categorias (hierarquica, limites, tags, automacoes) |
| `/goals` | Metas (progresso, quanto guardar por mes) |
| `/projection` | Projecao (composicao mensal, saldo projetado) |
| `/portfolio` | Patrimonio (ativos/dividas, alocacao, historico) |
| `/profile` | Perfil (plano, notificacoes, indicacao) |

---

## Design System

Estetica **Obsidian Bloom** — fintech premium escuro sobre base carbono:

| Papel | Cor |
|-------|-----|
| Primario (Indigo Bloom) | `#8332AC` |
| Acento (Violet) | `#E086D3` |
| Positivo / dinheiro (Celadon) | `#B8EBD0` |
| Destaque quente (Almond Silk) | `#F2D1C9` |
| Base (Carbon Black) | `#191919` |

Tipografia: **Space Grotesk** (numeros/display) + **Manrope** (corpo). Cards com borda hairline, grao sutil e gradiente assinatura indigo->violet. Tudo via CSS variables, com modo claro derivado da mesma paleta.

---

## Inicio Rapido

```bash
npm install
npm run dev
# abra http://localhost:3000
```

> Evite rodar `npm install` dentro de pastas sincronizadas (OneDrive/Dropbox) — a sincronizacao pode corromper o `node_modules` durante a instalacao.

---

## Integracao Open Finance (Pluggy)

O stub em `src/server/pluggy.ts` implementa o fluxo recomendado: autenticacao -> connect token -> contas/transacoes -> webhook. Para ativar:

1. Crie conta em https://dashboard.pluggy.ai e copie `CLIENT_ID` / `CLIENT_SECRET`.
2. Copie `.env.example` para `.env.local` e preencha as variaveis.
3. A rota `GET /api/pluggy/connect-token` ja devolve um token (mock se sem credenciais).
4. Adicione o Pluggy Connect Widget no frontend (`react-pluggy-connect`).

---

## Modelo de Dados

Entidades-alvo (refletidas nos tipos mockados em `src/lib/mock-data.ts`):

`User, Organization, Connection, Account, Transaction, Category, Tag, RecurringRule, Goal, CategoryAutomation, MonthlyBudget`

---

## Proximos Passos

- [ ] Autenticacao real (NextAuth: Google OAuth + Magic Link)
- [ ] Banco de dados (Prisma + PostgreSQL)
- [ ] Substituir mocks por dados reais da Pluggy + webhook de transacoes
- [ ] Categorizacao automatica (regras + LLM para nao categorizadas)
- [ ] Criptografia em repouso (AES-256), logs de auditoria, rate limiting
- [ ] Propagar o design Obsidian Bloom para as 11 telas internas
- [ ] Deploy: Vercel (front) + Supabase/Railway (DB)

---

## Licenca

MIT.
