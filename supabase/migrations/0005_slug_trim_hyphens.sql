-- 0004's cleanup substituted invalid characters with a hyphen but didn't
-- strip the leading/trailing hyphen that leaves behind (e.g. the trailing
-- newline in "taylorswift\n" became a trailing "-"), so the fixed-up slug
-- didn't actually match what lib/utils.ts's slugify() would ever produce.
-- It still resolved correctly end-to-end, just inconsistently. Finish the
-- job and tighten the constraint to match slugify()'s real output exactly.

update public.creators
set slug = regexp_replace(slug, '^-+|-+$', '', 'g')
where slug ~ '^-|-$';

alter table public.creators
  drop constraint if exists creators_slug_format;

alter table public.creators
  add constraint creators_slug_format check (slug ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$');
