# Stripe — Setup de Pagamentos (Lumina)

O código já está pronto. Falta criar os produtos/preços no Stripe e preencher as env vars.
> Comece em **modo de teste** do Stripe (chaves `sk_test_…`).

## 1. Produtos e preços (Stripe Dashboard → Products)
Crie dois produtos com **preço recorrente mensal (BRL)**:
- **Pro** — R$ 19,90/mês → copie o **Price ID** (`price_…`) → `STRIPE_PRICE_PRO`
- **Premium** — R$ 34,90/mês → `STRIPE_PRICE_PREMIUM`
  - O trial de **14 dias** do Premium é aplicado pelo código (`trial_period_days: 14`), não precisa configurar no preço.

## 2. Chaves (Stripe Dashboard → Developers → API keys)
- `STRIPE_SECRET_KEY` = `sk_test_…`

## 3. Webhook (Developers → Webhooks → Add endpoint)
- **Endpoint URL:** `https://SEU-DOMINIO/api/stripe/webhook` (em dev, use o Stripe CLI — abaixo)
- **Eventos:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copie o **Signing secret** (`whsec_…`) → `STRIPE_WEBHOOK_SECRET`

Dev local com o Stripe CLI:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# use o whsec_ que ele imprime no STRIPE_WEBHOOK_SECRET
```

## 4. Service role do Supabase (Settings → API)
O webhook não tem sessão de usuário, então atualiza o `profiles` com a **service role** (bypassa RLS).
- `SUPABASE_SERVICE_ROLE_KEY` = a chave `service_role` (⚠️ secreta, só no servidor; nunca no front)

## 5. Variáveis de ambiente (.env.local e Vercel)
```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO=
STRIPE_PRICE_PREMIUM=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=https://SEU-DOMINIO   # em dev: http://localhost:3000
```

## 6. Como funciona
1. Usuário sem acesso cai em `/upgrade` → clica **Assinar Pro/Premium** → `/api/stripe/checkout` cria a sessão → redireciona ao Stripe Checkout.
2. Após pagar, o Stripe chama `/api/stripe/webhook` → o app grava `profiles.plan` (pro/premium), `plan_status`, `stripe_customer_id` e `stripe_subscription_id`.
3. O gate (`hasAppAccess`) libera o app: plano pro/premium **ou** trial ativo.
4. **Gerenciar assinatura** (em `/profile`) abre o **Billing Portal** do Stripe (trocar cartão, cancelar).
5. Cancelou/expirou → webhook volta o `plan` para `trial` → acesso depende do trial.

Cartão de teste do Stripe: `4242 4242 4242 4242`, validade futura, CVC qualquer.
