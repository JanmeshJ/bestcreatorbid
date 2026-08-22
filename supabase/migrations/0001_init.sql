-- bestcreatorbid.lol initial schema
create extension if not exists "pgcrypto";

do $$ begin
  create type public.creator_status as enum ('active', 'disabled', 'removed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.bid_status as enum ('pending', 'succeeded', 'failed', 'refunded', 'expired');
exception when duplicate_object then null;
end $$;

create table if not exists public.creators (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  handle text not null,
  normalized_handle text not null,
  slug text not null unique,
  display_name text not null,
  bio text,
  avatar_url text,
  profile_url text not null,
  country_code text,
  verified boolean not null default false,
  status public.creator_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, normalized_handle)
);

create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null unique references public.creators(id) on delete cascade,
  total_bid_cents integer not null default 0 check (total_bid_cents >= 0),
  click_count integer not null default 0 check (click_count >= 0),
  current_rank integer,
  first_bid_at timestamptz,
  last_bid_at timestamptz,
  current_rank_started_at timestamptz,
  time_at_rank_one_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.creators(id) on delete set null,
  amount_cents integer not null check (amount_cents > 0),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  status public.bid_status not null default 'pending',
  supporter_name text,
  supporter_url text,
  supporter_public boolean not null default false,
  user_id uuid,
  creator_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_events (
  stripe_event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

create table if not exists public.outbound_clicks (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators(id) on delete cascade,
  source text,
  session_hash text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.creators(id) on delete set null,
  type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.creators(id) on delete set null,
  requester_name text not null,
  email text not null,
  reason text not null,
  proof text,
  message text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.removal_requests (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references public.creators(id) on delete set null,
  profile_url text,
  requester_name text not null,
  email text not null,
  reason text not null,
  proof text,
  message text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.presence (
  session_id text primary key,
  last_seen timestamptz not null default now()
);

create table if not exists public.click_throttle (
  key text primary key,
  window_start timestamptz not null default now(),
  hit_count integer not null default 0
);

create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hit_count integer not null default 0
);

create table if not exists public.admin_audit (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists creators_status_idx on public.creators (status);
create index if not exists creators_slug_idx on public.creators (slug);
create index if not exists leaderboard_rank_idx on public.leaderboard_entries (current_rank);
create index if not exists leaderboard_bid_idx on public.leaderboard_entries (total_bid_cents desc);
create index if not exists bids_status_idx on public.bids (status, created_at desc);
create index if not exists bids_creator_idx on public.bids (creator_id, created_at desc);
create index if not exists activity_created_idx on public.activity_events (created_at desc);
create index if not exists clicks_creator_idx on public.outbound_clicks (creator_id, created_at desc);
create index if not exists clicks_session_idx on public.outbound_clicks (session_hash, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists creators_updated_at on public.creators;
create trigger creators_updated_at before update on public.creators
for each row execute function public.set_updated_at();

drop trigger if exists leaderboard_updated_at on public.leaderboard_entries;
create trigger leaderboard_updated_at before update on public.leaderboard_entries
for each row execute function public.set_updated_at();

drop trigger if exists bids_updated_at on public.bids;
create trigger bids_updated_at before update on public.bids
for each row execute function public.set_updated_at();

create or replace function public.recalculate_ranks()
returns void
language plpgsql
as $$
begin
  update public.leaderboard_entries le
  set
    time_at_rank_one_seconds = time_at_rank_one_seconds
      + case
          when le.current_rank = 1 and le.current_rank_started_at is not null
            then greatest(0, floor(extract(epoch from (now() - le.current_rank_started_at)))::int)
          else 0
        end,
    current_rank = null
  where le.creator_id in (
    select c.id from public.creators c where c.status <> 'active'
  );

  with ranked as (
    select
      le.id,
      row_number() over (
        order by le.total_bid_cents desc, le.first_bid_at asc nulls last, le.created_at asc
      ) as new_rank
    from public.leaderboard_entries le
    join public.creators c on c.id = le.creator_id
    where c.status = 'active' and le.total_bid_cents > 0
  )
  update public.leaderboard_entries le
  set
    current_rank = r.new_rank,
    current_rank_started_at = case
      when le.current_rank is distinct from r.new_rank then now()
      else coalesce(le.current_rank_started_at, now())
    end,
    updated_at = now()
  from ranked r
  where le.id = r.id;
end;
$$;

create or replace function public.apply_successful_checkout(
  p_stripe_event_id text,
  p_event_type text,
  p_checkout_session_id text,
  p_payment_intent_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_rows integer := 0;
  v_bid public.bids%rowtype;
  v_creator_id uuid;
  v_payload jsonb;
  v_old_rank integer;
  v_new_rank integer;
  v_old_first uuid;
  v_was_new boolean := false;
  v_display_name text;
  v_handle text;
  v_slug text;
begin
  select * into v_bid
  from public.bids
  where stripe_checkout_session_id = p_checkout_session_id
  for update;

  if not found then
    raise exception 'No pending bid for checkout session %', p_checkout_session_id;
  end if;

  if v_bid.status = 'succeeded' then
    insert into public.stripe_events (stripe_event_id, event_type)
    values (p_stripe_event_id, p_event_type)
    on conflict (stripe_event_id) do nothing;
    return jsonb_build_object('ok', true, 'already_succeeded', true, 'bid_id', v_bid.id);
  end if;

  insert into public.stripe_events (stripe_event_id, event_type)
  values (p_stripe_event_id, p_event_type)
  on conflict (stripe_event_id) do nothing;

  get diagnostics v_event_rows = row_count;
  if v_event_rows = 0 then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  select creator_id into v_old_first
  from public.leaderboard_entries
  where current_rank = 1
  limit 1;

  if v_bid.creator_id is not null then
    v_creator_id := v_bid.creator_id;
    select current_rank into v_old_rank
    from public.leaderboard_entries
    where creator_id = v_creator_id;
  else
    v_payload := coalesce(v_bid.creator_payload, '{}'::jsonb);

    insert into public.creators (
      platform, handle, normalized_handle, slug, display_name, bio, avatar_url, profile_url, country_code
    )
    values (
      v_payload->>'platform',
      v_payload->>'handle',
      v_payload->>'normalized_handle',
      v_payload->>'slug',
      coalesce(nullif(v_payload->>'display_name', ''), v_payload->>'handle'),
      v_payload->>'bio',
      v_payload->>'avatar_url',
      v_payload->>'profile_url',
      nullif(v_payload->>'country_code', '')
    )
    on conflict (platform, normalized_handle) do update
      set
        display_name = case
          when excluded.display_name is not null and excluded.display_name <> '' then excluded.display_name
          else creators.display_name
        end,
        bio = coalesce(excluded.bio, creators.bio),
        avatar_url = coalesce(excluded.avatar_url, creators.avatar_url),
        profile_url = coalesce(excluded.profile_url, creators.profile_url),
        updated_at = now()
    returning id into v_creator_id;

    if v_creator_id is null then
      select id into v_creator_id
      from public.creators
      where platform = v_payload->>'platform'
        and normalized_handle = v_payload->>'normalized_handle';
    end if;

    select current_rank into v_old_rank
    from public.leaderboard_entries
    where creator_id = v_creator_id;

    v_was_new := v_old_rank is null;
  end if;

  update public.bids
  set
    creator_id = v_creator_id,
    status = 'succeeded',
    stripe_payment_intent_id = coalesce(p_payment_intent_id, stripe_payment_intent_id),
    updated_at = now()
  where id = v_bid.id;

  insert into public.leaderboard_entries (
    creator_id, total_bid_cents, first_bid_at, last_bid_at, current_rank_started_at
  )
  values (
    v_creator_id, v_bid.amount_cents, now(), now(), now()
  )
  on conflict (creator_id) do update
    set
      total_bid_cents = public.leaderboard_entries.total_bid_cents + excluded.total_bid_cents,
      last_bid_at = now(),
      first_bid_at = coalesce(public.leaderboard_entries.first_bid_at, excluded.first_bid_at),
      updated_at = now();

  perform public.recalculate_ranks();

  select current_rank into v_new_rank
  from public.leaderboard_entries
  where creator_id = v_creator_id;

  select display_name, handle, slug
  into v_display_name, v_handle, v_slug
  from public.creators
  where id = v_creator_id;

  if v_was_new then
    insert into public.activity_events (creator_id, type, metadata)
    values (
      v_creator_id,
      'NEW_CREATOR',
      jsonb_build_object(
        'handle', v_handle,
        'display_name', v_display_name,
        'slug', v_slug,
        'amount_cents', v_bid.amount_cents,
        'rank', v_new_rank
      )
    );
  end if;

  insert into public.activity_events (creator_id, type, metadata)
  values (
    v_creator_id,
    'BID_PLACED',
    jsonb_build_object(
      'handle', v_handle,
      'display_name', v_display_name,
      'slug', v_slug,
      'amount_cents', v_bid.amount_cents,
      'rank', v_new_rank,
      'previous_rank', v_old_rank,
      'supporter_public', v_bid.supporter_public,
      'supporter_name', case when v_bid.supporter_public then v_bid.supporter_name else null end
    )
  );

  if v_new_rank = 1 and (v_old_first is distinct from v_creator_id) then
    insert into public.activity_events (creator_id, type, metadata)
    values (
      v_creator_id,
      'TOOK_FIRST',
      jsonb_build_object(
        'handle', v_handle,
        'display_name', v_display_name,
        'slug', v_slug,
        'amount_cents', v_bid.amount_cents
      )
    );
  elsif v_old_rank is distinct from v_new_rank then
    insert into public.activity_events (creator_id, type, metadata)
    values (
      v_creator_id,
      'RANK_CHANGED',
      jsonb_build_object(
        'handle', v_handle,
        'display_name', v_display_name,
        'slug', v_slug,
        'from_rank', v_old_rank,
        'to_rank', v_new_rank,
        'amount_cents', v_bid.amount_cents
      )
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'creator_id', v_creator_id,
    'bid_id', v_bid.id,
    'rank', v_new_rank,
    'was_new', v_was_new
  );
end;
$$;

create or replace function public.reverse_refunded_bid(
  p_stripe_event_id text,
  p_event_type text,
  p_payment_intent_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_rows integer := 0;
  v_bid public.bids%rowtype;
begin
  insert into public.stripe_events (stripe_event_id, event_type)
  values (p_stripe_event_id, p_event_type)
  on conflict (stripe_event_id) do nothing;

  get diagnostics v_event_rows = row_count;
  if v_event_rows = 0 then
    return jsonb_build_object('ok', true, 'duplicate', true);
  end if;

  select * into v_bid
  from public.bids
  where stripe_payment_intent_id = p_payment_intent_id
  for update;

  if not found or v_bid.status = 'refunded' then
    return jsonb_build_object('ok', true, 'noop', true);
  end if;

  update public.bids
  set status = 'refunded', updated_at = now()
  where id = v_bid.id;

  if v_bid.creator_id is not null then
    update public.leaderboard_entries
    set total_bid_cents = greatest(0, total_bid_cents - v_bid.amount_cents)
    where creator_id = v_bid.creator_id;
    perform public.recalculate_ranks();
  end if;

  return jsonb_build_object('ok', true, 'bid_id', v_bid.id);
end;
$$;

create or replace function public.record_outbound_click(
  p_creator_id uuid,
  p_source text,
  p_session_hash text,
  p_ip_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_allowed boolean := true;
  v_count integer;
begin
  v_key := coalesce(p_ip_hash, p_session_hash, 'anon') || ':' || p_creator_id::text;

  insert into public.click_throttle (key, window_start, hit_count)
  values (v_key, now(), 1)
  on conflict (key) do update
    set
      hit_count = case
        when public.click_throttle.window_start < now() - interval '10 minutes' then 1
        else public.click_throttle.hit_count + 1
      end,
      window_start = case
        when public.click_throttle.window_start < now() - interval '10 minutes' then now()
        else public.click_throttle.window_start
      end
  returning hit_count into v_count;

  if v_count > 8 then
    v_allowed := false;
  end if;

  if v_allowed then
    insert into public.outbound_clicks (creator_id, source, session_hash, ip_hash)
    values (p_creator_id, p_source, p_session_hash, p_ip_hash);

    update public.leaderboard_entries
    set click_count = click_count + 1, updated_at = now()
    where creator_id = p_creator_id
      and exists (select 1 from public.creators c where c.id = p_creator_id and c.status = 'active');

    v_count := (select click_count from public.leaderboard_entries where creator_id = p_creator_id);

    if v_count in (10, 25, 50, 100, 250, 500, 1000) then
      insert into public.activity_events (creator_id, type, metadata)
      select
        p_creator_id,
        'CLICK_MILESTONE',
        jsonb_build_object(
          'clicks', v_count,
          'handle', c.handle,
          'display_name', c.display_name,
          'slug', c.slug
        )
      from public.creators c
      where c.id = p_creator_id;
    end if;
  end if;

  return jsonb_build_object('counted', v_allowed);
end;
$$;

create or replace function public.merge_creators(p_source uuid, p_target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source_cents integer := 0;
  v_source_clicks integer := 0;
begin
  if p_source = p_target then
    raise exception 'Cannot merge a creator into itself';
  end if;

  update public.bids set creator_id = p_target where creator_id = p_source;
  update public.outbound_clicks set creator_id = p_target where creator_id = p_source;
  update public.activity_events set creator_id = p_target where creator_id = p_source;
  update public.reports set creator_id = p_target where creator_id = p_source;

  select coalesce(total_bid_cents, 0), coalesce(click_count, 0)
  into v_source_cents, v_source_clicks
  from public.leaderboard_entries
  where creator_id = p_source;

  insert into public.leaderboard_entries (creator_id, total_bid_cents, click_count, first_bid_at, last_bid_at)
  values (p_target, v_source_cents, v_source_clicks, now(), now())
  on conflict (creator_id) do update
    set
      total_bid_cents = public.leaderboard_entries.total_bid_cents + excluded.total_bid_cents,
      click_count = public.leaderboard_entries.click_count + excluded.click_count,
      last_bid_at = now();

  delete from public.leaderboard_entries where creator_id = p_source;

  update public.creators
  set status = 'removed', updated_at = now()
  where id = p_source;

  perform public.recalculate_ranks();
end;
$$;

alter table public.creators enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.bids enable row level security;
alter table public.stripe_events enable row level security;
alter table public.outbound_clicks enable row level security;
alter table public.activity_events enable row level security;
alter table public.reports enable row level security;
alter table public.removal_requests enable row level security;
alter table public.presence enable row level security;
alter table public.click_throttle enable row level security;
alter table public.rate_limits enable row level security;
alter table public.admin_audit enable row level security;

drop policy if exists "public read active creators" on public.creators;
create policy "public read active creators"
  on public.creators for select
  using (status = 'active');

drop policy if exists "public read leaderboard" on public.leaderboard_entries;
create policy "public read leaderboard"
  on public.leaderboard_entries for select
  using (
    exists (
      select 1 from public.creators c
      where c.id = creator_id and c.status = 'active'
    )
  );

drop policy if exists "public read succeeded bids" on public.bids;
create policy "public read succeeded bids"
  on public.bids for select
  using (status = 'succeeded');

drop policy if exists "public read activity" on public.activity_events;
create policy "public read activity"
  on public.activity_events for select
  using (true);

-- Writes are service-role only (bypass RLS). No insert/update/delete policies for anon.

grant usage on schema public to anon, authenticated;
grant select on public.creators, public.leaderboard_entries, public.bids, public.activity_events to anon, authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      execute 'alter publication supabase_realtime add table public.leaderboard_entries';
    exception when duplicate_object then null;
    end;
    begin
      execute 'alter publication supabase_realtime add table public.activity_events';
    exception when duplicate_object then null;
    end;
  end if;
end $$;

alter table public.leaderboard_entries replica identity full;
alter table public.activity_events replica identity full;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

revoke all on function public.apply_successful_checkout(text, text, text, text) from public, anon, authenticated;
revoke all on function public.reverse_refunded_bid(text, text, text) from public, anon, authenticated;
revoke all on function public.merge_creators(uuid, uuid) from public, anon, authenticated;
revoke all on function public.recalculate_ranks() from public, anon, authenticated;
revoke all on function public.record_outbound_click(uuid, text, text, text) from public, anon, authenticated;

grant execute on function public.apply_successful_checkout(text, text, text, text) to service_role;
grant execute on function public.reverse_refunded_bid(text, text, text) to service_role;
grant execute on function public.merge_creators(uuid, uuid) to service_role;
grant execute on function public.recalculate_ranks() to service_role;
grant execute on function public.record_outbound_click(uuid, text, text, text) to service_role;
