---
title: Posts INSERT policy tightened to require author ownership
tsc: CC6.1, CC6.6
finding: KA-2026-05-30-RLS
owner: Kevin Armstrong
date: 2026-05-30
---

# Posts INSERT policy — owner-only WITH CHECK (KA-2026-05-30-RLS)

## Finding

The Supabase Database Linter `rls_policy_always_true`
(https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy)
flagged that the live INSERT policy on `public.posts`
(`posts_insert_authed`, introduced in
`20260518120000_posts_rls_policies.sql`) used `WITH CHECK (true)`.

The 2026-05-26 author-ownership work added an `author_id` column with a
default of `auth.uid()`, and replaced UPDATE / DELETE policies with
owner-only variants, but did not tighten the INSERT policy. Any
authenticated caller could therefore explicitly pass an
`author_id` belonging to another user and forge authorship on
new rows.

## Fix

Migration `20260530120000_posts_insert_author_check.sql`:

  - Drops `posts_insert_authed`.
  - Creates `posts_insert_owner` with `WITH CHECK (auth.uid() = author_id)`.

The column default of `auth.uid()` is unchanged, so authoring
clients that omit `author_id` continue to work.

## Verification

```sql
select policyname, cmd, with_check
  from pg_policies
  where tablename = 'posts' and cmd = 'INSERT';
-- expect: posts_insert_owner | INSERT | (auth.uid() = author_id)
```

Re-run the Supabase advisor; the `rls_policy_always_true` lint for
`public.posts` should disappear.

## References

  - OWASP API1:2023 — Broken Object Level Authorization
  - CWE-285 — Improper Authorization
  - Supabase advisor lint `0024_permissive_rls_policy`
