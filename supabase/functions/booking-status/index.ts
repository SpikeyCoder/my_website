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

    let email = queryEmail;
    if (!email && parsedToken?.email) {
      email = normalizeEmail(parsedToken.email);
    }

    if (!email) {
      return jsonResponse(request, 200, { ok: true, hasBooked: false });
    }

    if (!isValidEmail(email)) {
      return jsonResponse(request, 400, { error: "Invalid email format" });
    }

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

    const token = await createBookingToken(email);

    return jsonResponse(
      request,
      200,
      {
        ok: true,
        hasBooked,
        token,
        email,
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
