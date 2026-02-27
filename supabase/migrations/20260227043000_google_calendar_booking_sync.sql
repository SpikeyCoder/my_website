create table if not exists public.google_calendar_watch_state (
  id integer primary key default 1 check (id = 1),
  calendar_id text not null,
  channel_id text,
  channel_token text,
  resource_id text,
  expiration timestamptz,
  sync_token text,
  last_notification_at timestamptz,
  last_sync_at timestamptz,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_google_calendar_watch_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_google_calendar_watch_state_touch on public.google_calendar_watch_state;
create trigger trg_google_calendar_watch_state_touch
before update on public.google_calendar_watch_state
for each row
execute function public.touch_google_calendar_watch_state_updated_at();

alter table public.google_calendar_watch_state enable row level security;
revoke all on public.google_calendar_watch_state from anon, authenticated;

alter table public.booking_events
  add column if not exists google_event_id text;

create unique index if not exists booking_events_google_event_unique_idx
  on public.booking_events (email_normalized, source, event_type, google_event_id)
  where google_event_id is not null;
