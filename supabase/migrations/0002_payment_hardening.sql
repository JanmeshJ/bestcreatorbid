-- Payment hardening:
--   1. partial refunds subtract only the refunded delta, not the whole bid
--   2. rank is credited only when Stripe's collected amount matches the bid
--   3. disputed charges lose their remaining rank
--
-- Deliberately uses columns rather than new bid_status enum values:
-- `alter type ... add value` cannot be used in the same transaction that
-- references the new value, which breaks single-transaction migrations.

-- cumulative cents refunded against a bid (mirrors charge.amount_refunded)
alter table public.bids
  add column if not exists refunded_cents integer not null default 0
    check (refunded_cents >= 0);

alter table public.bids
  add column if not exists disputed_at timestamptz;

-- ---------------------------------------------------------------------------
-- apply_successful_checkout: verify the amount Stripe actually collected
-- ---------------------------------------------------------------------------
-- The 4-arg version is replaced by a 5-arg version, so drop it explicitly:
-- `create or replace` would otherwise leave a second overload behind.
drop function if exists public.apply_successful_checkout(text, text, text, text);

create or replace function public.apply_successful_checkout(
  p_stripe_event_id text,
  p_event_type text,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_amount_total_cents integer default null
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

  -- Never credit more rank than Stripe actually collected. Consume the event
  -- (rather than raising) so Stripe stops retrying a permanently bad payload,
  -- and park the bid as failed for an operator to inspect.
  if p_amount_total_cents is not null and p_amount_total_cents <> v_bid.amount_cents then
    update public.bids
    set status = 'failed', updated_at = now()
    where id = v_bid.id;

    return jsonb_build_object(
      'ok', false,
      'amount_mismatch', true,
      'bid_id', v_bid.id,
      'expected_cents', v_bid.amount_cents,
      'collected_cents', p_amount_total_cents
    );
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

-- ---------------------------------------------------------------------------
-- reverse_refunded_bid: subtract only the newly refunded delta
-- ---------------------------------------------------------------------------
-- charge.refunded fires on partial refunds too, and fires again for each
-- additional partial refund. p_amount_refunded_cents is the charge's
-- *cumulative* amount_refunded, so the delta is what has not been clawed
-- back yet.
drop function if exists public.reverse_refunded_bid(text, text, text);

create or replace function public.reverse_refunded_bid(
  p_stripe_event_id text,
  p_event_type text,
  p_payment_intent_id text,
  p_amount_refunded_cents integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_rows integer := 0;
  v_bid public.bids%rowtype;
  v_already integer;
  v_cumulative integer;
  v_delta integer;
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

  if not found then
    return jsonb_build_object('ok', true, 'noop', true);
  end if;

  v_already := coalesce(v_bid.refunded_cents, 0);

  -- A null amount means "no detail available", so fall back to a full refund.
  -- Clamp to the bid amount: Stripe's charge can exceed a single bid only if
  -- the data is inconsistent, and rank must never go more negative than given.
  v_cumulative := least(
    greatest(coalesce(p_amount_refunded_cents, v_bid.amount_cents), 0),
    v_bid.amount_cents
  );

  v_delta := v_cumulative - v_already;
  if v_delta <= 0 then
    return jsonb_build_object('ok', true, 'noop', true, 'bid_id', v_bid.id);
  end if;

  update public.bids
  set
    refunded_cents = v_cumulative,
    status = case when v_cumulative >= v_bid.amount_cents then 'refunded'::public.bid_status else v_bid.status end,
    updated_at = now()
  where id = v_bid.id;

  -- Only claw back rank that was actually granted.
  if v_bid.creator_id is not null and v_bid.status = 'succeeded' then
    update public.leaderboard_entries
    set total_bid_cents = greatest(0, total_bid_cents - v_delta)
    where creator_id = v_bid.creator_id;
    perform public.recalculate_ranks();
  end if;

  return jsonb_build_object(
    'ok', true,
    'bid_id', v_bid.id,
    'refunded_delta_cents', v_delta,
    'refunded_total_cents', v_cumulative
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- handle_disputed_charge: a disputed payment loses its remaining rank
-- ---------------------------------------------------------------------------
create or replace function public.handle_disputed_charge(
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
  v_remaining integer;
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

  if not found or v_bid.disputed_at is not null then
    return jsonb_build_object('ok', true, 'noop', true);
  end if;

  v_remaining := greatest(0, v_bid.amount_cents - coalesce(v_bid.refunded_cents, 0));

  update public.bids
  set disputed_at = now(), updated_at = now()
  where id = v_bid.id;

  if v_bid.creator_id is not null and v_bid.status = 'succeeded' and v_remaining > 0 then
    update public.leaderboard_entries
    set total_bid_cents = greatest(0, total_bid_cents - v_remaining)
    where creator_id = v_bid.creator_id;
    perform public.recalculate_ranks();
  end if;

  return jsonb_build_object('ok', true, 'bid_id', v_bid.id, 'removed_cents', v_remaining);
end;
$$;

-- ---------------------------------------------------------------------------
-- Re-apply the service_role-only grants for the new signatures
-- ---------------------------------------------------------------------------
revoke all on function public.apply_successful_checkout(text, text, text, text, integer) from public, anon, authenticated;
revoke all on function public.reverse_refunded_bid(text, text, text, integer) from public, anon, authenticated;
revoke all on function public.handle_disputed_charge(text, text, text) from public, anon, authenticated;

grant execute on function public.apply_successful_checkout(text, text, text, text, integer) to service_role;
grant execute on function public.reverse_refunded_bid(text, text, text, integer) to service_role;
grant execute on function public.handle_disputed_charge(text, text, text) to service_role;
