import { adminClient } from "../_shared/client.ts";
import { getWatchState, syncCalendarBookings, upsertWatchState } from "../_shared/calendar_booking_sync.ts";
import { getGoogleCalendarId } from "../_shared/google_calendar.ts";
import { optionsResponse } from "../_shared/cors.ts";
import { jsonResponse } from "../_shared/http.ts";

function adminTokenFromRequest(request: Request): string {
  const bearer = request.headers.get("authorization") || "";
  if (bearer.toLowerCase().startsWith("bearer ")) {
    return bearer.slice(7).trim();
  }
  return String(request.headers.get("x-admin-token") || "").trim();
}

function hasValidAdminToken(request: Request): boolean {
  const expected = String(Deno.env.get("GOOGLE_CALENDAR_ADMIN_TOKEN") || "").trim();
  if (!expected) {
    throw new Error("Missing GOOGLE_CALENDAR_ADMIN_TOKEN secret");
  }

  const provided = adminTokenFromRequest(request);
  return Boolean(provided) && provided === expected;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return optionsResponse(request);
  if (request.method !== "POST") {
    return jsonResponse(request, 405, { error: "Method not allowed" });
  }

  try {
    if (!hasValidAdminToken(request)) {
      return jsonResponse(request, 401, { error: "Unauthorized" });
    }

    const supabase = adminClient();
    const state = await getWatchState(supabase);

    if (!state) {
      return jsonResponse(request, 400, {
        error: "Google Calendar watch state not found. Run google-calendar-setup first.",
      });
    }

    const syncResult = await syncCalendarBookings(supabase, state, "google_calendar_sync", false);

    await upsertWatchState(supabase, {
      calendar_id: getGoogleCalendarId(),
      channel_id: state.channel_id,
      channel_token: state.channel_token,
      resource_id: state.resource_id,
      expiration: state.expiration,
      sync_token: syncResult.nextSyncToken,
      last_sync_at: new Date().toISOString(),
      last_notification_at: state.last_notification_at,
    });

    return jsonResponse(request, 200, {
      ok: true,
      sync: syncResult,
    });
  } catch (error) {
    return jsonResponse(request, 500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
