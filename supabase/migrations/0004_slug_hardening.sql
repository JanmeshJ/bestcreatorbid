-- A creator row ended up with a slug containing a trailing newline (likely
-- a manual paste directly into the table editor, bypassing slugify()).
-- /creator/[slug] pages do an exact string match, and browsers strip
-- whitespace from URLs before they ever reach the server, so a link to that
-- profile silently 404s into the generic "not on the board" page instead of
-- erroring loudly -- which just looks like the click did nothing.
--
-- Clean up any existing bad rows, then add a format constraint so a slug
-- can never again contain anything outside what slugify() itself produces
-- (lib/utils.ts), whether it comes from the app or a manual dashboard edit.

update public.creators
set slug = regexp_replace(lower(trim(slug)), '[^a-z0-9-]+', '-', 'g')
where slug !~ '^[a-z0-9-]+$';

alter table public.creators
  add constraint creators_slug_format check (slug ~ '^[a-z0-9-]+$');
