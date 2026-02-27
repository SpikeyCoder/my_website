import { adminClient } from "../_shared/client.ts";
import {
  createWatchChannel,
  getWatchState,
  stopExistingWatchChannel,
  syncCalendarBookings,
  upsertWatchState,
} from "../_shared/calendar_booking_sync.ts";
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

    const body = await request.json().catch(() => ({}));
    const skipSync = Boolean(body?.skipSync);

    const supabase = adminClient();
    const state = await getWatchState(supabase);

    let syncResult = null;
    if (!skipSync) {
      syncResult = await syncCalendarBookings(supabase, state, "google_calendar_setup", !state?.sync_token);
    }

    await stopExistingWatchChannel(state);
    const channel = await createWatchChannel();

    await upsertWatchState(supabase, {
      calendar_id: getGoogleCalendarId(),
      channel_id: channel.channelId,
      channel_token: channel.channelToken,
      resource_id: channel.resourceId,
      expiration: channel.expirationIso,
      sync_token: syncResult?.nextSyncToken || state?.sync_token || null,
      last_sync_at: syncResult ? new Date().toISOString() : state?.last_sync_at || null,
      last_notification_at: state?.last_notification_at || null,
    });

    return jsonResponse(request, 200, {
      ok: true,
      watch: {
        channelId: channel.channelId,
        resourceId: channel.resourceId,
        expiration: channel.expirationIso,
      },
      sync: syncResult,
    });
  } catch (error) {
    return jsonResponse(request, 500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
