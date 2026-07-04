import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, stripeConfigured, priceFor } from "@/server/stripe";

export async function POST(request: Request) {
  if (!stripeConfigured()) return NextResponse.json({ error: "Pagamento não configurado." }, { status: 400 });
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { plan } = await request.json().catch(() => ({ plan: null }));
  if (plan !== "pro" && plan !== "premium") return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
  const price = priceFor(plan);
  if (!price) return NextResponse.json({ error: `Preço do plano ${plan} não configurado.` }, { status: 400 });

  const stripe = getStripe();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;

  // cliente Stripe (reutiliza se já existir)
  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", user.id).single();
  let customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email ?? undefined, metadata: { user_id: user.id } });
    customerId = customer.id;
    await supabase.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price, quantity: 1 }],
    subscription_data: plan === "premium" ? { trial_period_days: 14 } : undefined,
    metadata: { user_id: user.id, plan },
    success_url: `${origin}/?checkout=success`,
    cancel_url: `${origin}/upgrade?checkout=cancel`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
