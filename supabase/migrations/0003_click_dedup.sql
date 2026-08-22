-- A leaderboard row has more than one link to the same creator (avatar,
-- click count, name -> profile -> "View profile" button), so a single
-- visitor exploring the page can fire several real click-throughs within
-- seconds. record_outbound_click previously counted every one of them.
-- This collapses repeat click-throughs from the same visitor into a single
-- counted click within a short window, while still logging every raw event
-- for the audit trail — a genuine return visit after the window still counts.

create index if not exists outbound_clicks_creator_recent_idx
  on public.outbound_clicks (creator_id, created_at desc);

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
  v_recent_duplicate boolean;
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
    select exists (
      select 1 from public.outbound_clicks
      where creator_id = p_creator_id
        and created_at > now() - interval '60 seconds'
        and (
          (p_session_hash is not null and session_hash = p_session_hash)
          or (p_ip_hash is not null and ip_hash = p_ip_hash)
        )
    ) into v_recent_duplicate;

    insert into public.outbound_clicks (creator_id, source, session_hash, ip_hash)
    values (p_creator_id, p_source, p_session_hash, p_ip_hash);

    if not v_recent_duplicate then
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
  end if;

  return jsonb_build_object('counted', v_allowed and not v_recent_duplicate);
end;
$$;
