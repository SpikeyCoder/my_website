import { adminClient } from "../_shared/client.ts";
import { optionsResponse } from "../_shared/cors.ts";
import { bookingTokenCookie, isValidEmail, normalizeEmail } from "../_shared/booking.ts";
import { jsonResponse, tokenFromRequest } from "../_shared/http.ts";
import { createBookingToken, verifyBookingToken } from "../_shared/token.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return optionsResponse(request);
  if (request.method !== "POST") {
    return jsonResponse(request, 405, { error: "Method not allowed" });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const tokenPayload = await verifyBookingToken(tokenFromRequest(request));

    const bodyEmail = normalizeEmail(body?.email);
    const tokenEmail = normalizeEmail(tokenPayload?.email);
    const email = bodyEmail || tokenEmail;

    if (!email || !isValidEmail(email)) {
      return jsonResponse(request, 400, { error: "Valid email is required" });
    }

    const source = String(body?.source || "manual_confirm").slice(0, 120);
    const stripeSessionId = body?.stripeSessionId ? String(body.stripeSessionId).slice(0, 250) : null;

    const supabase = adminClient();
    const now = new Date().toISOString();

    const { data: existing, error: existingError } = await supabase
      .from("booking_profiles")
      .select("first_booked_at")
      .eq("email_normalized", email)
      .maybeSingle();

    if (existingError) {
      return jsonResponse(request, 500, { error: existingError.message });
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
      return jsonResponse(request, 500, { error: upsertError.message });
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
      return jsonResponse(request, 500, { error: eventError.message });
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
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
