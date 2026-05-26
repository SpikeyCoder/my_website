-- =====================================================================
-- posts: add author_id column + restrict UPDATE/DELETE to row owner
-- =====================================================================
-- Defence-in-depth for public.posts.  The prior RLS policies allowed ANY
-- authenticated user to UPDATE or DELETE ANY row (using (true)).  This
-- migration adds an author_id FK to auth.users, backfills it for every
-- existing row, makes it NOT NULL, and replaces the overly-permissive
-- UPDATE / DELETE policies with owner-only variants.
--
-- SELECT (public read) and INSERT (authenticated) policies are unchanged.
-- =====================================================================

-- 1. Add nullable author_id column -----------------------------------------
alter table public.posts
  add column if not exists author_id uuid references auth.users(id);

-- 2. Backfill existing rows to Kevin Armstrong's auth uid ------------------
update public.posts
  set author_id = '4b519587-45f5-4fb3-8928-30a240d9ce56'
  where author_id is null;

-- 3. Make column NOT NULL now that every row has a value -------------------
alter table public.posts
  alter column author_id set not null;

-- 4. Index for faster policy checks ---------------------------------------
create index if not exists posts_author_id_idx on public.posts (author_id);

-- 5. Replace overly-permissive UPDATE / DELETE policies --------------------
drop policy if exists posts_update_authed on public.posts;
drop policy if exists posts_delete_authed on public.posts;

-- Owner-only UPDATE
create policy posts_update_owner
  on public.posts
  for update
  to authenticated
  using  (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- Owner-only DELETE
create policy posts_delete_owner
  on public.posts
  for delete
  to authenticated
  using (auth.uid() = author_id);

-- 6. Default author_id on INSERT so the app doesn't have to supply it ------
alter table public.posts
  alter column author_id set default auth.uid();
