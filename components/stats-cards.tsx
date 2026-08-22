import Link from "next/link";
import { CreatorAvatar } from "@/components/creator-avatar";
import { formatDuration, formatNumber, formatUsd } from "@/lib/utils";

type StatCreator = {
  display_name?: string;
  handle?: string;
  slug?: string;
  avatar_url?: string | null;
} | null;

export function StatsCards({
  mostClicked,
  longestReign,
  biggestEgo,
}: {
  mostClicked: { click_count?: number; creators?: StatCreator | StatCreator[] } | null;
  longestReign: { reignSeconds?: number; creators?: StatCreator | StatCreator[] } | null;
  biggestEgo: { total_bid_cents?: number; creators?: StatCreator | StatCreator[] } | null;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card
        kicker="Traffic"
        title="Most clicked"
        value={mostClicked?.click_count ? formatNumber(mostClicked.click_count) : "0"}
        creator={first(mostClicked?.creators)}
        empty="No clicks yet. First listing gets all of them."
      />
      <Card
        kicker="Crown"
        title="Longest reign"
        value={longestReign?.reignSeconds ? formatDuration(longestReign.reignSeconds) : "0s"}
        creator={first(longestReign?.creators)}
        empty="Nobody has held #1 yet."
      />
      <Card
        kicker="Spend"
        title="Biggest ego"
        value={biggestEgo?.total_bid_cents ? formatUsd(biggestEgo.total_bid_cents) : "$0"}
        creator={first(biggestEgo?.creators)}
        empty="The top bid is still waiting."
      />
    </div>
  );
}

function first(value: StatCreator | StatCreator[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function Card({
  kicker,
  title,
  value,
  creator,
  empty,
}: {
  kicker: string;
  title: string;
  value: string;
  creator: StatCreator;
  empty: string;
}) {
  return (
    <div className="rounded-[24px] border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(28,25,23,0.08)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">{kicker}</p>
      <p className="mt-1 text-sm font-bold">{title}</p>
      <p className="mt-4 text-4xl font-black tracking-tight">{value}</p>
      {creator?.slug ? (
        <Link href={`/creator/${creator.slug}`} className="mt-4 flex items-center gap-2">
          <CreatorAvatar name={creator.display_name || creator.handle || "?"} src={creator.avatar_url} size="sm" />
          <span className="text-sm font-semibold">{creator.display_name || creator.handle}</span>
        </Link>
      ) : (
        <p className="mt-4 text-sm text-muted">{empty}</p>
      )}
    </div>
  );
}
