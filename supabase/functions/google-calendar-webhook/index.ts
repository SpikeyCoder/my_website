import { adminClient } from "../_shared/client.ts";
import { getGoogleCalendarId } from "../_shared/google_calendar.ts";
import {
  getWatchState,
  markWatchNotification,
  syncCalendarBookings,
  upsertWatchState,
} from "../_shared/calendar_booking_sync.ts";
import { optionsResponse } from "../_shared/cors.ts";
import { jsonResponse } from "../_shared/http.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return optionsResponse(request);
  if (request.method !== "POST") {
    return jsonResponse(request, 405, { error: "Method not allowed" });
  }

  try {
    const supabase = adminClient();
    const state = await getWatchState(supabase);

    if (!state?.channel_id || !state.channel_token || !state.resource_id) {
      return jsonResponse(request, 400, { error: "Watch channel is not initialized" });
    }

    const channelId = String(request.headers.get("x-goog-channel-id") || "").trim();
    const channelToken = String(request.headers.get("x-goog-channel-token") || "").trim();
    const resourceId = String(request.headers.get("x-goog-resource-id") || "").trim();
    const resourceState = String(request.headers.get("x-goog-resource-state") || "").trim();

    if (!channelId || !channelToken || !resourceId) {
      return jsonResponse(request, 400, { error: "Missing Google channel headers" });
    }

    if (channelId !== state.channel_id || channelToken !== state.channel_token || resourceId !== state.resource_id) {
      return jsonResponse(request, 401, { error: "Webhook channel mismatch" });
    }

    await markWatchNotification(supabase);

    if (resourceState === "not_exists") {
      return jsonResponse(request, 200, { ok: true, skipped: "resource_not_exists" });
    }

    const syncResult = await syncCalendarBookings(supabase, state, "google_calendar_webhook", false);

    await upsertWatchState(supabase, {
      calendar_id: getGoogleCalendarId(),
      channel_id: state.channel_id,
      channel_token: state.channel_token,
      resource_id: state.resource_id,
      expiration: state.expiration,
      sync_token: syncResult.nextSyncToken,
      last_sync_at: new Date().toISOString(),
      last_notification_at: new Date().toISOString(),
    });

    return jsonResponse(request, 200, {
      ok: true,
      resourceState,
      sync: syncResult,
    });
  } catch (error) {
    return jsonResponse(request, 500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
