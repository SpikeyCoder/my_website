import { adminClient } from "../_shared/client.ts";
import { optionsResponse } from "../_shared/cors.ts";
import { bookingTokenCookie, isValidEmail, normalizeEmail } from "../_shared/booking.ts";
import { jsonResponse, sanitiseError } from "../_shared/http.ts";
import { createBookingToken } from "../_shared/token.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return optionsResponse(request);
  if (request.method !== "POST") {
    return jsonResponse(request, 405, { error: "Method not allowed" });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);

    if (!email || !isValidEmail(email)) {
      return jsonResponse(request, 400, { error: "Valid email is required" });
    }

    const supabase = adminClient();
    const now = new Date().toISOString();

    const { data: existing, error: existingError } = await supabase
      .from("booking_profiles")
      .select("email_normalized,has_booked")
      .eq("email_normalized", email)
      .maybeSingle();

    if (existingError) {
      return jsonResponse(request, 500, { error: sanitiseError(existingError, "Database operation failed") });
    }

    if (!existing) {
      const { error: insertProfileError } = await supabase
        .from("booking_profiles")
        .insert({
          email_normalized: email,
          has_booked: false,
          source: "intake",
          updated_at: now,
        });
      if (insertProfileError) {
        return jsonResponse(request, 500, { error: sanitiseError(insertProfileError, "Database operation failed") });
      }
    }

    const { error: eventError } = await supabase.from("booking_events").insert({
      email_normalized: email,
      event_type: "booking.intake",
      source: "website",
      metadata: {
        user_agent: request.headers.get("user-agent") || "",
      },
    });

    if (eventError) {
      return jsonResponse(request, 500, { error: sanitiseError(eventError, "Database operation failed") });
    }

    const token = await createBookingToken(email);
    const hasBooked = Boolean(existing?.has_booked);

    return jsonResponse(
      request,
      200,
      {
        ok: true,
        hasBooked,
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
