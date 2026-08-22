import { adminConfigured } from "@/lib/config";
import { type PlatformId } from "@/lib/platforms";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ActivityEvent, Creator, LeaderboardRow } from "@/lib/supabase/types";

export async function getLeaderboard(platform?: PlatformId | "all") {
  if (!adminConfigured()) return [];
  const admin = createAdminClient();
  let query = admin
    .from("leaderboard_entries")
    .select("*, creators(*)")
    .not("current_rank", "is", null)
    .order("current_rank", { ascending: true })
    .limit(100);

  if (platform && platform !== "all") {
    query = query.eq("creators.platform", platform);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = ((data ?? []) as LeaderboardRow[]).filter((row) => {
    if (!row.creators || row.creators.status !== "active") return false;
    if (platform && platform !== "all" && row.creators.platform !== platform) return false;
    return true;
  });

  if (platform && platform !== "all") {
    return rows
      .sort(
        (a, b) =>
          // equal totals keep the global order, where the earlier bidder stays on top
          b.total_bid_cents - a.total_bid_cents ||
          (a.current_rank ?? Number.MAX_SAFE_INTEGER) - (b.current_rank ?? Number.MAX_SAFE_INTEGER)
      )
      .map((row, index) => ({ ...row, filter_rank: index + 1 }));
  }

  return rows.map((row) => ({ ...row, filter_rank: row.current_rank ?? 0 }));
}

export async function getCreatorBySlug(slug: string) {
  if (!adminConfigured()) return null;
  const admin = createAdminClient();
  const { data: creator } = await admin
    .from("creators")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();
  if (!creator) return null;
  const { data: entry } = await admin
    .from("leaderboard_entries")
    .select("*")
    .eq("creator_id", creator.id)
    .maybeSingle();
  const { data: bids } = await admin
    .from("bids")
    .select("id, amount_cents, supporter_name, supporter_public, created_at")
    .eq("creator_id", creator.id)
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(20);
  const { count } = await admin
    .from("bids")
    .select("id", { count: "exact", head: true })
    .eq("creator_id", creator.id)
    .eq("status", "succeeded");
  return {
    creator: creator as Creator,
    entry,
    bids: bids ?? [],
    bidCount: count ?? 0,
  };
}

export async function getSiteStats() {
  if (!adminConfigured()) {
    return {
      bidTodayCents: 0,
      bidAllCents: 0,
      clicksSent: 0,
      creatorCount: 0,
      onlineCount: 0,
      mostClicked: null,
      longestReign: null,
      biggestEgo: null,
    };
  }
  const admin = createAdminClient();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const [
    bidToday,
    bidAll,
    clicks,
    creators,
    presence,
    mostClicked,
    longestReign,
    biggestEgo,
  ] = await Promise.all([
    admin
      .from("bids")
      .select("amount_cents")
      .eq("status", "succeeded")
      .gte("created_at", startOfDay.toISOString()),
    admin.from("bids").select("amount_cents").eq("status", "succeeded"),
    admin.from("outbound_clicks").select("id", { count: "exact", head: true }),
    admin.from("creators").select("id", { count: "exact", head: true }).eq("status", "active"),
    admin.from("presence").select("session_id", { count: "exact", head: true }).gt("last_seen", new Date(Date.now() - 5 * 60 * 1000).toISOString()),
    admin
      .from("leaderboard_entries")
      .select("click_count, creator_id, creators(display_name, handle, slug, avatar_url, platform)")
      .order("click_count", { ascending: false })
      .limit(1),
    admin
      .from("leaderboard_entries")
      .select("time_at_rank_one_seconds, current_rank, current_rank_started_at, creator_id, creators(display_name, handle, slug, avatar_url, platform)")
      .eq("current_rank", 1)
      .limit(1),
    admin
      .from("leaderboard_entries")
      .select("total_bid_cents, creator_id, creators(display_name, handle, slug, avatar_url, platform)")
      .order("total_bid_cents", { ascending: false })
      .limit(1),
  ]);

  const bidTodayCents = (bidToday.data ?? []).reduce((sum, row) => sum + row.amount_cents, 0);
  const bidAllCents = (bidAll.data ?? []).reduce((sum, row) => sum + row.amount_cents, 0);

  const reign = longestReign.data?.[0];
  let reignSeconds = 0;
  if (reign) {
    reignSeconds = reign.time_at_rank_one_seconds ?? 0;
    if (reign.current_rank === 1 && reign.current_rank_started_at) {
      reignSeconds += Math.floor((Date.now() - new Date(reign.current_rank_started_at).getTime()) / 1000);
    }
  }

  return {
    bidTodayCents,
    bidAllCents,
    clicksSent: clicks.count ?? 0,
    creatorCount: creators.count ?? 0,
    onlineCount: presence.count ?? 0,
    mostClicked: mostClicked.data?.[0] ?? null,
    longestReign: reign ? { ...reign, reignSeconds } : null,
    biggestEgo: biggestEgo.data?.[0] ?? null,
  };
}

export async function getActivity(limit = 40) {
  if (!adminConfigured()) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("activity_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ActivityEvent[];
}

export async function getTopBidCents() {
  if (!adminConfigured()) return 0;
  const admin = createAdminClient();
  const { data } = await admin
    .from("leaderboard_entries")
    .select("total_bid_cents")
    .order("total_bid_cents", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.total_bid_cents ?? 0;
}

export async function getAdminBundle() {
  if (!adminConfigured()) {
    return { creators: [], bids: [], reports: [], removals: [], stats: await getSiteStats() };
  }
  const admin = createAdminClient();
  const [creators, bids, reports, removals, stats] = await Promise.all([
    admin.from("creators").select("*").order("created_at", { ascending: false }).limit(200),
    admin.from("bids").select("*, creators(display_name, handle, slug, platform)").order("created_at", { ascending: false }).limit(200),
    admin.from("reports").select("*").order("created_at", { ascending: false }).limit(100),
    admin.from("removal_requests").select("*").order("created_at", { ascending: false }).limit(100),
    getSiteStats(),
  ]);
  return {
    creators: creators.data ?? [],
    bids: bids.data ?? [],
    reports: reports.data ?? [],
    removals: removals.data ?? [],
    stats,
  };
}
