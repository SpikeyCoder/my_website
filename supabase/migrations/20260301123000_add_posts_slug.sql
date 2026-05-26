alter table public.posts
add column if not exists slug text;

update public.posts
set slug = concat(
  coalesce(
    nullif(trim(both '-' from regexp_replace(lower(coalesce(title, '')), '[^a-z0-9]+', '-', 'g')), ''),
    'post'
  ),
  '-',
  coalesce(
    nullif(right(regexp_replace(coalesce(id::text, ''), '[^a-zA-Z0-9]', '', 'g'), 8), ''),
    substr(md5(coalesce(id::text, '')), 1, 8)
  )
)
where slug is null or slug = '';

alter table public.posts
alter column slug set not null;

create unique index if not exists posts_slug_key
on public.posts (slug);
