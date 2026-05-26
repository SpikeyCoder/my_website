create extension if not exists pgcrypto;

create table if not exists public.booking_profiles (
  email_normalized text primary key,
  has_booked boolean not null default false,
  first_booked_at timestamptz,
  updated_at timestamptz not null default now(),
  source text not null default 'unknown'
);

create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  email_normalized text not null,
  event_type text not null,
  source text not null default 'unknown',
  stripe_session_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists booking_events_email_created_idx
  on public.booking_events (email_normalized, created_at desc);

create index if not exists booking_events_type_created_idx
  on public.booking_events (event_type, created_at desc);

create or replace function public.touch_booking_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_booking_profiles_touch on public.booking_profiles;
create trigger trg_booking_profiles_touch
before update on public.booking_profiles
for each row
execute function public.touch_booking_profiles_updated_at();

alter table public.booking_profiles enable row level security;
alter table public.booking_events enable row level security;

revoke all on public.booking_profiles from anon, authenticated;
revoke all on public.booking_events from anon, authenticated;
