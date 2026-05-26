import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";
import { adminClient } from "../_shared/client.ts";
import { optionsResponse } from "../_shared/cors.ts";
import { bookingTokenCookie, isValidEmail, normalizeEmail } from "../_shared/booking.ts";
import { jsonResponse, tokenFromRequest, sanitiseError } from "../_shared/http.ts";
import { createBookingToken, verifyBookingToken } from "../_shared/token.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return optionsResponse(request);
  if (request.method !== "POST") {
    return jsonResponse(request, 405, { error: "Method not allowed" });
  }

  try {
    const body = await request.json().catch(() => ({}));

    // SECURITY: require a valid booking token. The body-supplied email is
    // never trusted on its own — anyone can set body.email = victim@example.com.
    const tokenPayload = await verifyBookingToken(tokenFromRequest(request));
    const tokenEmail = normalizeEmail(tokenPayload?.email);

    if (!tokenEmail || !isValidEmail(tokenEmail)) {
      return jsonResponse(request, 401, { error: "Authenticated booking token required" });
    }

    // If a body email is provided it MUST match the token's email; otherwise
    // we'd let an attacker confirm a booking for a different user.
    const bodyEmail = normalizeEmail(body?.email);
    if (bodyEmail && bodyEmail !== tokenEmail) {
      return jsonResponse(request, 403, { error: "Body email does not match authenticated token" });
    }

    const email = tokenEmail;


    const source = String(body?.source || "manual_confirm").slice(0, 120);
    const stripeSessionId = body?.stripeSessionId ? String(body.stripeSessionId).slice(0, 250) : null;

    // WA-2026-05-23-10: when the client supplies a Stripe session id, verify
    // it really belongs to the authenticated email and is in a paid state
    // before writing it into the booking_events audit trail. Without this,
    // a holder of a valid booking token could forge any Stripe session id
    // (including a competitor's real one) and pollute reconciliation logs.
    if (stripeSessionId) {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
      if (!stripeKey) {
        return jsonResponse(request, 503, { error: "Stripe verification unavailable" });
      }
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });
        const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
        const stripeEmail = normalizeEmail(
          session.customer_details?.email
            || session.customer_email
            || (typeof session.metadata?.email === "string" ? session.metadata.email : undefined),
        );
        if (!stripeEmail || stripeEmail !== email) {
          return jsonResponse(request, 403, { error: "Stripe session email does not match authenticated token" });
        }
        if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
          return jsonResponse(request, 402, { error: "Stripe session is not paid" });
        }
      } catch (err) {
        // Don't leak Stripe error details; log server-side.
        return jsonResponse(request, 400, { error: sanitiseError(err, "Stripe session verification failed") });
      }
    }

    const supabase = adminClient();
    const now = new Date().toISOString();

    const { data: existing, error: existingError } = await supabase
      .from("booking_profiles")
      .select("first_booked_at")
      .eq("email_normalized", email)
      .maybeSingle();

    if (existingError) {
      return jsonResponse(request, 500, { error: sanitiseError(existingError, "Database operation failed") });
    }

    const firstBookedAt = existing?.first_booked_at || now;

    const { error: upsertError } = await supabase
      .from("booking_profiles")
      .upsert({
        email_normalized: email,
        has_booked: true,
        first_booked_at: firstBookedAt,
        updated_at: now,
        source,
      });

    if (upsertError) {
      return jsonResponse(request, 500, { error: sanitiseError(upsertError, "Database operation failed") });
    }

    const { error: eventError } = await supabase.from("booking_events").insert({
      email_normalized: email,
      event_type: "booking.confirmed",
      source,
      stripe_session_id: stripeSessionId,
      metadata: {
        confirmed_at: now,
      },
    });

    if (eventError) {
      return jsonResponse(request, 500, { error: sanitiseError(eventError, "Database operation failed") });
    }

    const token = await createBookingToken(email);

    return jsonResponse(
      request,
      200,
      {
        ok: true,
        hasBooked: true,
        token,
        email,
      },
      {
        "Set-Cookie": bookingTokenCookie(token),
      },
    );
  } catch (error) {
    return jsonResponse(request, 500, {
      error: sanitiseError(error, "Internal server error"),
    });
  }
});
