-- =====================================================================
-- KA-2026-05-18-RLS — explicit, version-controlled RLS for public.posts
-- =====================================================================
-- The `posts` table backs the public blog at kevinarmstrong.io and is read
-- and written from the browser using the publishable anon key (see
-- blog/blog.js and main.js). The 2026-05-18 authorized pen-test report
-- (Armstrong_HoldCo_Pentest_Report_2026-05-18.docx, finding KA-1) flagged
-- that no RLS or policy for `posts` was present in version control, so the
-- live security posture was inferrable only from the Supabase project state
-- and could silently drift on rebuild or branch creation.
--
-- This migration is idempotent and brings the posts table policies under
-- change control:
--   - RLS is enabled.
--   - Anyone (including the anon role) may SELECT - this is a public blog.
--   - Only authenticated users may INSERT / UPDATE / DELETE.
--   - Service role retains full access (Supabase default).
-- =====================================================================

-- Defensive: the table is expected to exist from the remote baseline.
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'posts'
  ) then
    raise notice 'public.posts not present yet; skipping RLS migration';
    return;
  end if;

  execute 'alter table public.posts enable row level security';
  execute 'alter table public.posts force row level security';
end
$$;

-- Drop any prior policies with the same names so this migration is
-- safe to re-run.
drop policy if exists posts_select_public  on public.posts;
drop policy if exists posts_insert_authed  on public.posts;
drop policy if exists posts_update_authed  on public.posts;
drop policy if exists posts_delete_authed  on public.posts;

-- Public read.
create policy posts_select_public
  on public.posts
  for select
  to anon, authenticated
  using (true);

-- Authenticated-only writes.
create policy posts_insert_authed
  on public.posts
  for insert
  to authenticated
  with check (true);

create policy posts_update_authed
  on public.posts
  for update
  to authenticated
  using (true)
  with check (true);

create policy posts_delete_authed
  on public.posts
  for delete
  to authenticated
  using (true);

-- Belt-and-braces: revoke direct write grants from anon.
revoke insert, update, delete on public.posts from anon;

-- Verification (commented; run manually after apply):
--   select schemaname, tablename, rowsecurity, forcerowsecurity
--     from pg_tables where schemaname='public' and tablename='posts';
--   select policyname, cmd, roles from pg_policies where tablename='posts';
