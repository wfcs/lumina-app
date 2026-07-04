import Stripe from "stripe";
import { getStripe, planFromPriceId, stripeConfigured } from "@/server/stripe";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  if (!stripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Stripe não configurado.", { status: 400 });
  }
  const sig = request.headers.get("stripe-signature");
  const raw = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig ?? "", process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return new Response(`Assinatura inválida: ${e}`, { status: 400 });
  }

  const db = createServiceClient();

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.client_reference_id ?? (s.metadata?.user_id as string | undefined);
      if (userId && s.subscription) {
        const sub = await stripe.subscriptions.retrieve(s.subscription as string);
        const plan = planFromPriceId(sub.items.data[0]?.price.id) ?? (s.metadata?.plan as "pro" | "premium" | undefined) ?? "pro";
        await db.from("profiles").update({
          plan, plan_status: sub.status,
          stripe_customer_id: s.customer as string,
          stripe_subscription_id: sub.id,
        }).eq("id", userId);
      }
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription;
      const deleted = event.type === "customer.subscription.deleted";
      const active = ["active", "trialing", "past_due"].includes(sub.status);
      const plan = deleted || !active ? "trial" : (planFromPriceId(sub.items.data[0]?.price.id) ?? "trial");
      await db.from("profiles").update({
        plan, plan_status: sub.status,
        stripe_subscription_id: deleted ? null : sub.id,
      }).eq("stripe_customer_id", sub.customer as string);
    }
  } catch (e) {
    return new Response(`Erro ao processar: ${e}`, { status: 500 });
  }

  return new Response("ok");
}
