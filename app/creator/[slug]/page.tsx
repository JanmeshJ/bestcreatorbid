import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BoostWidget } from "@/components/boost-widget";
import { CreatorAvatar } from "@/components/creator-avatar";
import { PlatformIcon } from "@/components/platform-icon";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getActivity, getCreatorBySlug, getLeaderboard, getSiteStats, getTopBidCents } from "@/lib/data";
import { amountToOutrank, centsToDollars } from "@/lib/money";
import { PLATFORMS, displayHandle } from "@/lib/platforms";
import { formatDuration, formatNumber, formatUsd, timeAgo } from "@/lib/utils";
import { ReportForm } from "@/components/report-form";
import { ShareClientButton } from "@/components/share-client-button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCreatorBySlug(slug);
  if (!data) return { title: "Creator" };
  const rank = data.entry?.current_rank;
  const title = `${data.creator.display_name} is ${rank ? `#${rank}` : "on"} BestCreatorBid.lol`;
  const description = `${data.creator.display_name} (${displayHandle(data.creator.platform as keyof typeof PLATFORMS, data.creator.handle)}) is ranked by money on BestCreatorBid.lol.`;
  return {
    title,
    description,
    alternates: { canonical: `/creator/${data.creator.slug}` },
    openGraph: {
      title: rank === 1 ? "Who's the best creator? Money decides." : title,
      description: rank === 1 ? "Creators bid. Rankings move. Ego wins." : description,
      url: `/creator/${data.creator.slug}`,
      siteName: "BestCreatorBid.lol",
    },
    twitter: {
      card: "summary_large_image",
      title: rank === 1 ? "Who's the best creator? Money decides." : title,
      description: rank === 1 ? "Creators bid. Rankings move. Ego wins." : description,
    },
  };
}

export default async function CreatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, stats, activity, leaderCents, board] = await Promise.all([
    getCreatorBySlug(slug),
    getSiteStats(),
    getActivity(),
    getTopBidCents(),
    getLeaderboard(),
  ]);
  if (!data) notFound();
  const { creator, entry, bids, bidCount } = data;
  const rank = entry?.current_rank ?? null;
  const total = entry?.total_bid_cents ?? 0;
  const above = rank && rank > 1 ? board.find((row) => row.current_rank === rank - 1) : null;
  const toNext = above ? centsToDollars(amountToOutrank(above.total_bid_cents, total)) : null;
  // board is already the full, unfiltered leaderboard (getLeaderboard() with
  // no platform arg), so no extra query needed for the boost widget's
  // rank-projection math.
  const boardTotals = board.map((row) => ({ creatorId: row.creators.id, cents: row.total_bid_cents }));
  const platform = PLATFORMS[creator.platform as keyof typeof PLATFORMS];
  const rankAge = entry?.current_rank_started_at
    ? Math.floor((Date.now() - new Date(entry.current_rank_started_at).getTime()) / 1000)
    : 0;

  return (
    <AppShell activity={activity}>
      <SiteHeader
        onlineCount={stats.onlineCount}
        bidTodayCents={stats.bidTodayCents}
        clicksSent={stats.clicksSent}
      />
      <main className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-24 pt-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="panel p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <CreatorAvatar name={creator.display_name} src={creator.avatar_url} size="xl" />
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-accent">
                Currently {rank ? `#${rank}` : "unranked"} on BestCreatorBid.lol
              </p>
              <h1 className="mt-2 text-4xl font-black tracking-tight">
                {creator.display_name} {creator.verified && <span className="text-accent">✓</span>}
              </h1>
              <p className="mt-1 text-muted">
                {displayHandle(creator.platform as keyof typeof PLATFORMS, creator.handle)}
              </p>
              <div className="mt-3 flex items-center gap-2 text-sm font-semibold">
                <PlatformIcon id={creator.platform} size="sm" />
                {platform?.name || creator.platform}
              </div>
            </div>
          </div>
          {creator.bio && <p className="mt-6 text-muted">{creator.bio}</p>}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/go/${creator.id}?src=profile`}>
                View profile <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <ShareClientButton rank={rank || 0} handle={displayHandle(creator.platform as keyof typeof PLATFORMS, creator.handle)} slug={creator.slug} />
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Rank" value={rank ? `#${rank}` : "unranked"} />
            <Stat label="Total bid" value={formatUsd(total)} />
            <Stat label="Clicks sent" value={formatNumber(entry?.click_count ?? 0)} />
            <Stat label="Time at rank" value={formatDuration(rankAge)} />
          </dl>
          <p className="mt-4 text-sm text-muted">
            <span className="font-mono tabular-nums">{bidCount}</span> successful bid{bidCount === 1 ? "" : "s"} /
            backers
          </p>
          {toNext != null && above && (
            <p className="mt-4 text-lg font-bold">
              <span className="font-mono tabular-nums">${toNext}</span> to take #{(rank || 2) - 1}
            </p>
          )}
          {rank !== 1 && (
            <p className="mt-1 text-sm text-accent-strong">
              <span className="font-mono tabular-nums">${centsToDollars(amountToOutrank(leaderCents, total))}</span> to
              take #1
            </p>
          )}
          <div className="mt-8">
            <ReportForm creatorId={creator.id} handle={creator.handle} />
          </div>
        </section>
        <div className="space-y-6">
          <BoostWidget creator={creator} currentTotal={total} leaderCents={leaderCents} boardTotals={boardTotals} />
          <section className="panel p-6">
            <h2 className="font-black">Recent bids</h2>
            <div className="mt-4 space-y-3">
              {bids.length === 0 && <p className="text-sm text-muted">No public bid history yet.</p>}
              {bids.map((bid) => (
                <div key={bid.id} className="flex items-center justify-between rounded-2xl bg-stone-50 px-3 py-2">
                  <div>
                    <p className="font-mono font-bold tabular-nums">{formatUsd(bid.amount_cents)}</p>
                    <p className="text-xs text-muted">
                      {bid.supporter_public && bid.supporter_name ? bid.supporter_name : "Anonymous backer"}
                    </p>
                  </div>
                  <p className="text-xs text-muted">{timeAgo(bid.created_at)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-stone-50 px-3 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-mono text-xl font-black tabular-nums">{value}</p>
    </div>
  );
}
