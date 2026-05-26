import { sanitiseError } from "../_shared/http.ts";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { adminClient } from "../_shared/client.ts";
import { optionsResponse } from "../_shared/cors.ts";
import { normalizeEmail } from "../_shared/booking.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return optionsResponse(request);
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
  const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

  if (!stripeSecretKey || !stripeWebhookSecret) {
    return new Response("Missing Stripe env vars", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature") || "";
  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const payload = await request.text();
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, stripeWebhookSecret);
  } catch (error) {
    sanitiseError(error, "stripe webhook signature verification failed");
    return new Response("Webhook signature verification failed", {
      status: 400,
    });
  }

  try {
    const supabase = adminClient();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = normalizeEmail(
        session.customer_details?.email || session.customer_email || session.metadata?.email,
      );
      const stripeSessionId = session.id;

      if (email) {
        // WA-2026-05-23-09: a completed checkout session is the
        // authoritative paid-booking signal. Previously this branch only
        // created an empty `has_booked=false` row, so a paid customer
        // could remain marked as not-booked if the browser leg of the
        // confirmation flow never fired (closed tab, ad-blocker, etc.).
        //
        // Now we upsert with has_booked=true and preserve the earliest
        // first_booked_at (idempotent on Stripe replay).
        const nowIso = new Date().toISOString();
        const { data: existingRow } = await supabase
          .from("booking_profiles")
          .select("first_booked_at")
          .eq("email_normalized", email)
          .maybeSingle();

        const firstBookedAt = existingRow?.first_booked_at || nowIso;

        await supabase
          .from("booking_profiles")
          .upsert(
            {
              email_normalized: email,
              has_booked: true,
              first_booked_at: firstBookedAt,
              source: "stripe_webhook",
              updated_at: nowIso,
            },
            { onConflict: "email_normalized" },
          );
      }

      await supabase.from("booking_events").insert({
        email_normalized: email || "unknown",
        event_type: "stripe.checkout.session.completed",
        source: "stripe_webhook",
        stripe_session_id: stripeSessionId,
        metadata: {
          amount_total: session.amount_total,
          currency: session.currency,
          payment_status: session.payment_status,
          customer: session.customer,
        },
      });
    }

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const email = normalizeEmail(intent.receipt_email || intent.metadata?.email);

      await supabase.from("booking_events").insert({
        email_normalized: email || "unknown",
        event_type: "stripe.payment_intent.succeeded",
        source: "stripe_webhook",
        stripe_session_id: null,
        metadata: {
          amount: intent.amount,
          currency: intent.currency,
          status: intent.status,
          payment_intent_id: intent.id,
        },
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: sanitiseError(error, "Internal server error") }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
