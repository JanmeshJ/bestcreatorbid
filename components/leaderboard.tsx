"use client";

import Link from "next/link";
import { CreatorAvatar } from "@/components/creator-avatar";
import { PlatformIcon } from "@/components/platform-icon";
import { useBidFlow } from "@/components/bid-flow-context";
import { MIN_BID_CENTS } from "@/lib/constants";
import { amountToOutrank, centsToDollars } from "@/lib/money";
import { displayHandle, type PlatformId } from "@/lib/platforms";
import type { LeaderboardRow } from "@/lib/supabase/types";
import { formatNumber, formatUsd, timeAgoShort } from "@/lib/utils";

type Row = LeaderboardRow & { filter_rank: number };

const MEDALS: Record<number, React.CSSProperties> = {
  1: { backgroundImage: "linear-gradient(135deg, var(--gold-1), var(--gold-2))", color: "#5a3c05" },
  2: { backgroundImage: "linear-gradient(135deg, var(--silver-1), var(--silver-2))", color: "#33373c" },
  3: { backgroundImage: "linear-gradient(135deg, var(--bronze-1), var(--bronze-2))", color: "#402206" },
};

export function Leaderboard({ rows, platformLabel }: { rows: Row[]; platformLabel?: string }) {
  const { prepareTakeSpot } = useBidFlow();

  if (rows.length === 0) {
    return (
      <div className="px-3 py-10 text-center">
        <p className="text-lg font-extrabold tracking-tight">Nobody is on the board yet.</p>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
          {platformLabel
            ? `No ${platformLabel} bids so far. The seat is wide open.`
            : `A $${MIN_BID_CENTS / 100} bid puts the first creator here. Every click after that goes through them.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {rows.map((row) => {
        const creator = row.creators;
        const rank = row.filter_rank || row.current_rank || 0;
        const medal = MEDALS[rank];
        const takeAmount = centsToDollars(amountToOutrank(row.total_bid_cents));
        const handle = displayHandle(creator.platform as PlatformId, creator.handle);
        const name = handle.replace(/^@/, "") || creator.display_name;
        const listedAt = row.last_bid_at || row.first_bid_at || row.created_at;

        return (
          <article
            key={row.id}
            className={`group relative cursor-pointer rounded-2xl p-3 transition ${
              rank === 1
                ? "bg-gradient-to-r from-accent-soft to-accent-soft/40 ring-1 ring-accent/25"
                : "hover:bg-black/[0.035]"
            }`}
            onClick={(event) => {
              const target = event.target as HTMLElement;
              if (target.closest("a,button")) return;
              prepareTakeSpot({ amountDollars: takeAmount, handle, rank });
            }}
          >
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 inline-flex h-7 min-w-9 shrink-0 items-center justify-center rounded-full bg-black/[0.06] px-2 font-mono text-[11px] font-black tabular-nums"
                style={medal}
              >
                #{rank}
              </span>

              <Link href={`/go/${creator.id}?src=leaderboard`} className="relative shrink-0">
                <CreatorAvatar name={creator.display_name} src={creator.avatar_url} rounded="lg" />
                <span className="absolute -bottom-1 -right-1 rounded-md ring-2 ring-white">
                  <PlatformIcon id={creator.platform} size="sm" className="h-4 w-4 rounded" />
                </span>
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/creator/${creator.slug}`}
                    className="truncate text-[15px] font-extrabold hover:underline"
                  >
                    {name}
                    {creator.verified && <span className="ml-1 text-sky">✓</span>}
                  </Link>
                  <p className="shrink-0 font-mono text-[17px] font-black tabular-nums text-accent">
                    {formatUsd(row.total_bid_cents)}
                  </p>
                </div>

                <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-muted">
                  {creator.bio || "Click through to their page. That visit is why this rank costs money."}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] font-semibold text-muted">
                  <span>{timeAgoShort(listedAt)}</span>
                  <Link
                    href={`/go/${creator.id}?src=leaderboard`}
                    className="inline-flex items-center gap-1.5 text-lime"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    <span className="font-mono tabular-nums">{formatNumber(row.click_count)}</span> clicks
                  </Link>
                  <span className="ml-auto rounded-full bg-accent/10 px-2 py-0.5 font-bold text-accent transition group-hover:bg-accent group-hover:text-white">
                    <span className="font-mono tabular-nums">${takeAmount}</span> takes #{rank}
                  </span>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
