-- Local development only. Do NOT apply in production.
-- Fictional creators so the UI can be exercised without live payments.

insert into public.creators (
  platform, handle, normalized_handle, slug, display_name, bio, profile_url, country_code, verified
) values
  ('youtube', 'northstar', 'northstar', 'northstar', 'Ava North', 'Late-night essays and too many tabs.', 'https://www.youtube.com/@northstar', 'IE', false),
  ('tiktok', 'kaistreams', 'kaistreams', 'kaistreams', 'Kai Rivers', 'Tiny kitchens. Huge opinions.', 'https://www.tiktok.com/@kaistreams', 'US', false),
  ('instagram', 'lumenlabs', 'lumenlabs', 'lumenlabs', 'Lumen Labs', 'Making ordinary objects look expensive.', 'https://www.instagram.com/lumenlabs/', 'GB', false)
on conflict (platform, normalized_handle) do nothing;

insert into public.leaderboard_entries (creator_id, total_bid_cents, click_count, current_rank, first_bid_at, last_bid_at, current_rank_started_at)
select c.id, seed.total, seed.clicks, seed.rank, now() - interval '2 days', now() - interval '3 hours', now() - interval '3 hours'
from (values
  ('northstar', 4200, 18, 1),
  ('kaistreams', 2700, 41, 2),
  ('lumenlabs', 900, 7, 3)
) as seed(slug, total, clicks, rank)
join public.creators c on c.slug = seed.slug
on conflict (creator_id) do nothing;

insert into public.bids (creator_id, amount_cents, status, supporter_public)
select c.id, seed.amount, 'succeeded', false
from (values
  ('northstar', 4200),
  ('kaistreams', 2700),
  ('lumenlabs', 900)
) as seed(slug, amount)
join public.creators c on c.slug = seed.slug;

insert into public.activity_events (creator_id, type, metadata)
select c.id, 'TOOK_FIRST', jsonb_build_object('handle', c.handle, 'display_name', c.display_name, 'slug', c.slug, 'amount_cents', 4200)
from public.creators c where c.slug = 'northstar';
