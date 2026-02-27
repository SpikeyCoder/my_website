import { isValidEmail, normalizeEmail } from "./booking.ts";
import {
  getAppointmentSetId,
  getGoogleCalendarId,
  getServiceAccountEmail,
  getWebhookTtlSeconds,
  googleCalendarRequest,
} from "./google_calendar.ts";

export const WATCH_STATE_ID = 1;

interface SupabaseLike {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: unknown): {
        maybeSingle(): Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
    };
    upsert(payload: Record<string, unknown>): Promise<{ error: { message: string } | null }>;
    insert(payload: Record<string, unknown>): Promise<{ error: { message: string; code?: string } | null }>;
    update(payload: Record<string, unknown>): {
      eq(column: string, value: unknown): Promise<{ error: { message: string } | null }>;
    };
  };
}

interface CalendarEvent {
  id?: string;
  status?: string;
  summary?: string;
  htmlLink?: string;
  created?: string;
  updated?: string;
  creator?: { email?: string };
  organizer?: { email?: string };
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  attendees?: Array<{ email?: string; responseStatus?: string }>;
  extendedProperties?: {
    shared?: Record<string, string>;
  };
}

interface CalendarListResponse {
  items?: CalendarEvent[];
  nextPageToken?: string;
  nextSyncToken?: string;
}

export interface WatchStateRow {
  id: number;
  calendar_id: string;
  channel_id: string | null;
  channel_token: string | null;
  resource_id: string | null;
  expiration: string | null;
  sync_token: string | null;
  last_notification_at: string | null;
  last_sync_at: string | null;
  updated_at: string | null;
}

export interface SyncResult {
  mode: "incremental" | "full";
  expiredSyncToken: boolean;
  nextSyncToken: string;
  eventsSeen: number;
  eventsMatched: number;
  profilesUpdated: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function bookingTimestamp(event: CalendarEvent): string {
  return String(event.created || event.updated || nowIso());
}

function pickEventStart(event: CalendarEvent): string | null {
  if (event.start?.dateTime) return event.start.dateTime;
  if (event.start?.date) return `${event.start.date}T00:00:00Z`;
  return null;
}

function eventMatchesAppointmentSet(event: CalendarEvent): boolean {
  const shared = event.extendedProperties?.shared || {};
  return shared.goo_createdBySet === getAppointmentSetId() || shared["goo.createdBySet"] === getAppointmentSetId();
}

function guestEmailsFromEvent(event: CalendarEvent): string[] {
  const owner = normalizeEmail(getGoogleCalendarId());
  const serviceAccount = normalizeEmail(getServiceAccountEmail());
  const attendees = event.attendees || [];
  const set = new Set<string>();

  for (const attendee of attendees) {
    const email = normalizeEmail(attendee.email);
    if (!email || !isValidEmail(email)) continue;
    if (email === owner || email === serviceAccount) continue;
    set.add(email);
  }

  return Array.from(set);
}

export async function getWatchState(supabase: SupabaseLike): Promise<WatchStateRow | null> {
  const { data, error } = await supabase
    .from("google_calendar_watch_state")
    .select("id,calendar_id,channel_id,channel_token,resource_id,expiration,sync_token,last_notification_at,last_sync_at,updated_at")
    .eq("id", WATCH_STATE_ID)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load watch state: ${error.message}`);
  }

  if (!data) return null;
  return data as unknown as WatchStateRow;
}

export async function upsertWatchState(
  supabase: SupabaseLike,
  payload: Partial<WatchStateRow> & { calendar_id: string },
): Promise<void> {
  const fullPayload: Record<string, unknown> = {
    id: WATCH_STATE_ID,
    ...payload,
  };

  const { error } = await supabase.from("google_calendar_watch_state").upsert(fullPayload);
  if (error) {
    throw new Error(`Unable to save watch state: ${error.message}`);
  }
}

export async function markWatchNotification(supabase: SupabaseLike): Promise<void> {
  const { error } = await supabase
    .from("google_calendar_watch_state")
    .update({
      last_notification_at: nowIso(),
    })
    .eq("id", WATCH_STATE_ID);

  if (error) {
    throw new Error(`Unable to update watch notification timestamp: ${error.message}`);
  }
}

async function insertBookingEvent(
  supabase: SupabaseLike,
  email: string,
  event: CalendarEvent,
  source: string,
): Promise<void> {
  const eventId = String(event.id || "").trim();
  if (!eventId) return;

  const { error } = await supabase.from("booking_events").insert({
    email_normalized: email,
    event_type: "booking.confirmed",
    source,
    google_event_id: eventId,
    metadata: {
      google_event_id: eventId,
      summary: event.summary || "",
      html_link: event.htmlLink || "",
      start: event.start || null,
      end: event.end || null,
      organizer: event.organizer?.email || "",
      creator: event.creator?.email || "",
      observed_at: nowIso(),
    },
  });

  // Duplicate event confirmations are fine; this index keeps the table clean.
  if (error && error.code !== "23505") {
    throw new Error(`Unable to insert booking event: ${error.message}`);
  }
}

async function markProfileBooked(
  supabase: SupabaseLike,
  email: string,
  source: string,
  firstBookedAtHint: string | null,
): Promise<void> {
  const { data: existing, error: readError } = await supabase
    .from("booking_profiles")
    .select("first_booked_at")
    .eq("email_normalized", email)
    .maybeSingle();

  if (readError) {
    throw new Error(`Unable to read booking profile: ${readError.message}`);
  }

  const firstBookedAt = String(existing?.first_booked_at || firstBookedAtHint || nowIso());
  const { error: upsertError } = await supabase.from("booking_profiles").upsert({
    email_normalized: email,
    has_booked: true,
    first_booked_at: firstBookedAt,
    updated_at: nowIso(),
    source,
  });

  if (upsertError) {
    throw new Error(`Unable to upsert booking profile: ${upsertError.message}`);
  }
}

async function applyEventBookings(
  supabase: SupabaseLike,
  event: CalendarEvent,
  source: string,
): Promise<number> {
  if (!event.id || event.status === "cancelled") return 0;
  if (!eventMatchesAppointmentSet(event)) return 0;

  const guests = guestEmailsFromEvent(event);
  if (!guests.length) return 0;

  const bookedAt = bookingTimestamp(event) || pickEventStart(event) || nowIso();
  for (const email of guests) {
    await markProfileBooked(supabase, email, source, bookedAt);
    await insertBookingEvent(supabase, email, event, source);
  }

  return guests.length;
}

interface CalendarSyncOutcome {
  nextSyncToken: string;
  mode: "incremental" | "full";
  expiredSyncToken: boolean;
  eventsSeen: number;
  eventsMatched: number;
  profilesUpdated: number;
}

export async function syncCalendarBookings(
  supabase: SupabaseLike,
  state: WatchStateRow | null,
  source: string,
  forceFullSync = false,
): Promise<CalendarSyncOutcome> {
  const calendarId = getGoogleCalendarId();
  const initialSyncToken = state?.sync_token || "";
  let useFullSync = forceFullSync || !initialSyncToken;
  let syncToken = initialSyncToken;
  let expiredSyncToken = false;

  let eventsSeen = 0;
  let eventsMatched = 0;
  let profilesUpdated = 0;

  while (true) {
    let pageToken = "";
    let nextSyncToken = "";
    let restartWithFullSync = false;

    while (true) {
      const query: Record<string, string> = {
        maxResults: "250",
        singleEvents: "true",
      };

      if (useFullSync) {
        query.showDeleted = "false";
      } else {
        query.showDeleted = "true";
      }

      if (pageToken) {
        query.pageToken = pageToken;
      }

      if (!useFullSync && syncToken) {
        query.syncToken = syncToken;
      }

      const response = await googleCalendarRequest(
        `calendars/${encodeURIComponent(calendarId)}/events`,
        { method: "GET" },
        query,
      );

      if (response.status === 410 && !useFullSync) {
        useFullSync = true;
        syncToken = "";
        expiredSyncToken = true;
        restartWithFullSync = true;
        break;
      }

      const payload = (await response.json().catch(() => ({}))) as CalendarListResponse & { error?: { message?: string } };

      if (!response.ok) {
        const message = payload?.error?.message || `Google Calendar API error: ${response.status}`;
        if (!useFullSync && message.toLowerCase().includes("sync token cannot be used")) {
          useFullSync = true;
          syncToken = "";
          expiredSyncToken = true;
          restartWithFullSync = true;
          break;
        }
        throw new Error(message);
      }

      const items = Array.isArray(payload.items) ? payload.items : [];
      eventsSeen += items.length;

      for (const event of items) {
        const applied = await applyEventBookings(supabase, event, source);
        if (applied > 0) {
          eventsMatched += 1;
          profilesUpdated += applied;
        }
      }

      if (payload.nextPageToken) {
        pageToken = payload.nextPageToken;
        continue;
      }

      nextSyncToken = String(payload.nextSyncToken || "");
      break;
    }

    if (restartWithFullSync) {
      continue;
    }

    if (!nextSyncToken) {
      throw new Error("Google Calendar sync did not return nextSyncToken");
    }

    return {
      nextSyncToken,
      mode: useFullSync ? "full" : "incremental",
      expiredSyncToken,
      eventsSeen,
      eventsMatched,
      profilesUpdated,
    };
  }
}

export async function stopExistingWatchChannel(state: WatchStateRow | null): Promise<void> {
  if (!state?.channel_id || !state?.resource_id) return;

  const response = await googleCalendarRequest("channels/stop", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: state.channel_id,
      resourceId: state.resource_id,
    }),
  });

  // 404/410 means the channel was already gone. That's fine.
  if (response.ok || response.status === 404 || response.status === 410) {
    return;
  }

  const payload = await response.text().catch(() => "");
  throw new Error(`Unable to stop existing channel (${response.status}): ${payload}`);
}

export async function createWatchChannel(): Promise<{
  channelId: string;
  channelToken: string;
  resourceId: string;
  expirationIso: string | null;
}> {
  const supabaseUrl = String(Deno.env.get("SUPABASE_URL") || "").trim();
  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL env var");
  }

  const calendarId = getGoogleCalendarId();
  const channelId = crypto.randomUUID();
  const channelToken = crypto.randomUUID();
  const address = `${supabaseUrl}/functions/v1/google-calendar-webhook`;

  const response = await googleCalendarRequest(
    `calendars/${encodeURIComponent(calendarId)}/events/watch`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: channelId,
        type: "web_hook",
        address,
        token: channelToken,
        params: {
          ttl: String(getWebhookTtlSeconds()),
        },
      }),
    },
  );

  const payload = (await response.json().catch(() => ({}))) as {
    resourceId?: string;
    expiration?: string;
    error?: { message?: string };
  };

  if (!response.ok || !payload.resourceId) {
    const message = payload?.error?.message || `Unable to create watch channel (${response.status})`;
    throw new Error(message);
  }

  const expirationIso = payload.expiration
    ? new Date(Number(payload.expiration)).toISOString()
    : null;

  return {
    channelId,
    channelToken,
    resourceId: String(payload.resourceId),
    expirationIso,
  };
}
