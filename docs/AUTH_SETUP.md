# Configuração de Autenticação — Lumina (Supabase)

Projeto Supabase: **lumina-app**
URL: `https://bqalbkmpxpfvyihkpniv.supabase.co`

O código já está pronto. Falta apenas: instalar deps, configurar URLs e ativar os provedores OAuth no painel do Supabase (as credenciais de cada provedor são secretas — cole-as direto no Supabase).

---

## 1. Instalar dependências

```bash
npm install
npm run dev
```

As variáveis já estão em `.env.local` (URL + anon key, que é pública por design).

---

## 2. URLs de redirecionamento (Supabase → Authentication → URL Configuration)

- **Site URL:** `http://localhost:3000` (em produção, a URL da Vercel)
- **Redirect URLs (adicionar todas que usar):**
  - `http://localhost:3000/**`
  - `https://SEU-DOMINIO.vercel.app/**`

O app redireciona o OAuth para `/auth/callback`, que troca o código pela sessão.

---

## 3. Ativar provedores (Supabase → Authentication → Providers)

Em **todos**, a URL de callback a registrar no provedor é:

```
https://bqalbkmpxpfvyihkpniv.supabase.co/auth/v1/callback
```

### Google
1. Google Cloud Console → APIs & Services → Credentials → OAuth Client ID (Web).
2. Authorized redirect URI = a callback acima.
3. Cole **Client ID** e **Client Secret** no provider Google do Supabase. Ative.

### Microsoft (provider "Azure")
1. Azure Portal → Microsoft Entra ID → App registrations → New registration.
2. Redirect URI (Web) = a callback acima.
3. Crie um Client Secret. Cole **Application (client) ID** e **secret** no provider **Azure** do Supabase.
4. (Opcional) Defina o Azure Tenant URL para restringir a uma organização.

### Apple
1. Requer **Apple Developer Program** (US$ 99/ano).
2. Crie um App ID + Services ID, habilite "Sign in with Apple".
3. Return URL = a callback acima. Gere a chave (.p8) e o client secret (JWT).
4. Cole **Services ID** e **secret** no provider Apple do Supabase.

> Apple é o mais trabalhoso. Sugestão: comece por Google e Microsoft e adicione Apple depois.

---

## 4. Como o fluxo funciona

1. `/login` — botões Google / Microsoft / Apple → `signInWithOAuth`.
2. Provedor → `/auth/callback` → troca código pela sessão (cookies).
3. `middleware.ts` protege todas as rotas:
   - sem sessão → `/login`
   - com sessão mas **sem CPF/CNPJ** → `/onboarding`
   - com tudo ok → app liberado
4. `/onboarding` — valida CPF/CNPJ (dígitos no cliente e no Postgres) e grava em `profiles.tax_id`.

## 5. Regras de CPF/CNPJ (no banco)

- `profiles.tax_id` é **UNIQUE** → um CPF/CNPJ não pode ter duas contas (erro `23505` → mensagem amigável).
- Trigger valida dígitos verificadores e define `tax_id_type` (cpf/cnpj).
- Após gravado, o CPF/CNPJ **não pode ser alterado** (trigger bloqueia).
- RLS: cada usuário só lê/edita o próprio `profiles`.

## 6. Migrations aplicadas

- `identity_profiles_cpf_cnpj` — tabela, funções de validação, triggers, RLS.
- `harden_trigger_functions_execute` — revoga EXECUTE das funções de trigger (segurança).

Advisors de segurança do Supabase: **0 alertas**.
