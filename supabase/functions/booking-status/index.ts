import { adminClient } from "../_shared/client.ts";
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

    const supabase = adminClient();
    const { data, error } = await supabase
      .from("booking_profiles")
      .select("has_booked")
      .eq("email_normalized", email)
      .maybeSingle();

    if (error) {
      return jsonResponse(request, 500, { error: error.message });
    }

    const token = await createBookingToken(email);

    return jsonResponse(
      request,
      200,
      {
        ok: true,
        hasBooked: Boolean(data?.has_booked),
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
