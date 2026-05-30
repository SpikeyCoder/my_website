-- =====================================================================
-- KA-2026-05-30-RLS — tighten posts INSERT policy (Supabase advisor lint
-- `rls_policy_always_true`).
-- =====================================================================
-- Background.  Migration `20260518120000_posts_rls_policies.sql` defined
-- the live INSERT policy on `public.posts` as `WITH CHECK (true)` so
-- any authenticated user could insert.  Migration
-- `20260526120000_posts_author_id_rls.sql` added an `author_id` column
-- (defaulting to `auth.uid()`) and replaced the UPDATE / DELETE policies
-- with owner-only variants — but it left the INSERT policy with the
-- always-true predicate.
--
-- The default value protects the happy path (clients that omit
-- `author_id` get their own uid stamped in), but a malicious or buggy
-- authenticated caller can still pass an explicit `author_id` belonging
-- to another user, forging authorship.  Supabase Database Linter flags
-- the policy as `rls_policy_always_true` for this reason
-- (https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy).
--
-- This migration:
--   1. Drops `posts_insert_authed`.
--   2. Creates `posts_insert_owner` that requires the row's
--      `author_id` to equal `auth.uid()` at INSERT time.
-- =====================================================================

drop policy if exists posts_insert_authed on public.posts;

create policy posts_insert_owner
  on public.posts
  for insert
  to authenticated
  with check (auth.uid() = author_id);

-- Verification (manual):
--   select policyname, cmd, with_check
--     from pg_policies where tablename='posts' and cmd='INSERT';
--   -- expect: posts_insert_owner | INSERT | (auth.uid() = author_id)
