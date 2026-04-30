import { hasEmailBookedInCalendar } from "../_shared/calendar_booking_sync.ts";
import { optionsResponse } from "../_shared/cors.ts";
import { bookingTokenCookie, isValidEmail, normalizeEmail } from "../_shared/booking.ts";
import { jsonResponse, tokenFromRequest } from "../_shared/http.ts";
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

    // SECURITY: do not mint tokens or set cookies for unauthenticated callers.
    // The previous behaviour issued a freshly-signed bearer for any
    // ?email=victim@example.com query, which an attacker could replay against
    // booking-confirm to impersonate that user.
    if (!tokenEmail) {
      // Unauthenticated: return only a public-safe boolean. We refuse to
      // disclose whether an arbitrary email has booked.
      return jsonResponse(request, 200, { ok: true, hasBooked: false, authenticated: false });
    }

    // If a query email is supplied it must match the token's email — we never
    // act as a third party.
    if (queryEmail && queryEmail !== tokenEmail) {
      return jsonResponse(request, 403, { error: "Query email does not match authenticated token" });
    }

    const email = tokenEmail;

    if (!isValidEmail(email)) {
      return jsonResponse(request, 400, { error: "Invalid email format" });
    }

    // SECURITY: refresh=1 hits the Google Calendar API with the supplied
    // email. Restrict it to the authenticated path (already gated above
    // because we only proceed past this point with a verified token email).
    const forceRefresh = ["1", "true", "yes"].includes(
      String(url.searchParams.get("refresh") || "").trim().toLowerCase(),
    );

    let hasBooked = false;
    let syncError: string | null = null;
    let checkedEvents = 0;

    if (forceRefresh) {
      try {
        const liveLookup = await hasEmailBookedInCalendar(email);
        hasBooked = liveLookup.hasBooked;
        checkedEvents = liveLookup.checkedEvents;
      } catch (error) {
        syncError = error instanceof Error ? error.message : "Calendar refresh failed";
      }
    }

    // Token rotation: rotate the booking token for the authenticated user only.
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
        ...(forceRefresh ? { checkedEvents } : {}),
        ...(syncError ? { syncError } : {}),
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
