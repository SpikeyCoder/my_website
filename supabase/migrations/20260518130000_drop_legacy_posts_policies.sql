-- =====================================================================
-- Drop legacy dashboard-created RLS policies on public.posts
-- =====================================================================
-- PR #39 (merged 2026-05-18) added four explicit, well-named RLS
-- policies to public.posts under version control. Three older policies
-- created via the Supabase dashboard are now redundant and should be
-- removed to keep the policy list clean and auditable.
--
-- Legacy policies being removed:
--   "Read posts"              (SELECT, roles: {public})
--   "Admin insert"            (INSERT, roles: {public})
--   "admin can update posts"  (UPDATE, roles: {public})
--
-- Replacement policies (from PR #39, not touched here):
--   posts_select_public       (SELECT, anon + authenticated)
--   posts_insert_authed       (INSERT, authenticated)
--   posts_update_authed       (UPDATE, authenticated)
--   posts_delete_authed       (DELETE, authenticated)
-- =====================================================================

drop policy if exists "Read posts" on public.posts;
drop policy if exists "Admin insert" on public.posts;
drop policy if exists "admin can update posts" on public.posts;
