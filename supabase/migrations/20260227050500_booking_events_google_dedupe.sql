delete from public.booking_events a
using public.booking_events b
where a.id > b.id
  and a.google_event_id is not null
  and b.google_event_id is not null
  and a.email_normalized = b.email_normalized
  and a.event_type = b.event_type
  and a.google_event_id = b.google_event_id;

drop index if exists public.booking_events_google_event_unique_idx;

create unique index if not exists booking_events_google_event_unique_idx
  on public.booking_events (email_normalized, event_type, google_event_id)
  where google_event_id is not null;
