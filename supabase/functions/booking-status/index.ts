import { adminClient } from "../_shared/client.ts";
import { hasEmailBookedInCalendar } from "../_shared/calendar_booking_sync.ts";
import { optionsResponse } from "../_shared/cors.ts";
import { bookingTokenCookie, isValidEmail, normalizeEmail } from "../_shared/booking.ts";
import { jsonResponse, tokenFromRequest, sanitiseError } from "../_shared/http.ts";
import { createBookingToken, verifyBookingToken } from "../_shared/token.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return optionsResponse(request);
  if (request.method !== "GET") {
    return jsonResponse(request, 405, { error: "Method not allowed" });
  }

  try {
    const url = new URL(request.url);
    const queryEmail = normalizeEmail(url.searchParams.get("email"));
    const parsedToken = await verifyBookingToken(tokenFromRequest(request));
    const tokenEmail = normalizeEmail(parsedToken?.email);

    if (!tokenEmail) {
      return jsonResponse(request, 200, { ok: true, hasBooked: false, authenticated: false });
    }

    if (queryEmail && queryEmail !== tokenEmail) {
      return jsonResponse(request, 403, { error: "Query email does not match authenticated token" });
    }

    const email = tokenEmail;

    if (!isValidEmail(email)) {
      return jsonResponse(request, 400, { error: "Invalid email format" });
    }

    const forceRefresh = ["1", "true", "yes"].includes(
      String(url.searchParams.get("refresh") || "").trim().toLowerCase(),
    );

    let hasBooked = false;
    let source: string | null = null;
    let syncError: string | null = null;
    let checkedEvents = 0;

    // 1. Primary check: booking_profiles database table
    const supabase = adminClient();
    try {
      const { data: profile } = await supabase
        .from("booking_profiles")
        .select("has_booked, source")
        .eq("email_normalized", email)
        .maybeSingle();

      if (profile?.has_booked) {
        hasBooked = true;
        source = profile.source || "database";
      }
    } catch (error) {
      sanitiseError(error, "Database lookup failed");
    }

    // 2. Fallback: Google Calendar (only if not found in DB and forceRefresh)
    if (!hasBooked && forceRefresh) {
      try {
        const liveLookup = await hasEmailBookedInCalendar(email);
        hasBooked = liveLookup.hasBooked;
        checkedEvents = liveLookup.checkedEvents;

        if (hasBooked) {
          source = "google_calendar_sync";
          const now = new Date().toISOString();
          await supabase
            .from("booking_profiles")
            .upsert(
              {
                email_normalized: email,
                has_booked: true,
                first_booked_at: now,
                updated_at: now,
                source: "google_calendar_sync",
              },
              { onConflict: "email_normalized" },
            );
        }
      } catch (error) {
        sanitiseError(error, "Calendar refresh failed");
        syncError = "Calendar refresh failed";
      }
    }

    const token = await createBookingToken(email);

    return jsonResponse(
      request,
      200,
      {
        ok: true,
        hasBooked,
        token,
        email,
        authenticated: true,
        ...(source ? { source } : {}),
        ...(forceRefresh ? { checkedEvents } : {}),
        ...(syncError ? { syncError } : {}),
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
