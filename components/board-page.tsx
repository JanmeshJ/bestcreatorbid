import { BiddingWidget } from "@/components/bidding-widget";
import { BoardPulse } from "@/components/board-pulse";
import { Hero } from "@/components/hero";
import { Leaderboard } from "@/components/leaderboard";
import { PlatformFilters } from "@/components/platform-filters";
import type { BoardTotal } from "@/lib/data";
import type { PlatformId } from "@/lib/platforms";
import type { ActivityEvent, LeaderboardRow } from "@/lib/supabase/types";

export function BoardPage({
  rows,
  activity,
  leaderCents,
  boardTotals,
  activePlatform,
  platformLabel,
}: {
  rows: (LeaderboardRow & { filter_rank: number })[];
  activity: ActivityEvent[];
  leaderCents: number;
  boardTotals: BoardTotal[];
  activePlatform?: PlatformId | "all";
  platformLabel?: string;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-4 sm:pt-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
        <div className="min-w-0 lg:sticky lg:top-32 lg:self-start">
          <Hero platformLabel={platformLabel} />

          <div className="panel mt-4 p-4 sm:p-6">
            <BiddingWidget leaderCents={leaderCents} boardTotals={boardTotals} />
          </div>

          <div className="mt-3 hidden flex-wrap justify-center gap-2 sm:flex lg:justify-start">
            <Chip className="bg-lime-soft text-lime">Ranks move instantly</Chip>
            <Chip className="bg-grape-soft text-grape">No account needed</Chip>
          </div>
        </div>

        <section className="min-w-0 space-y-3">
          <BoardPulse rows={rows} activity={activity} />
          <PlatformFilters active={activePlatform} />

          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="text-base font-extrabold">
                {platformLabel ? `${platformLabel} board` : "Leaderboard"}
              </h2>
              <p className="text-xs font-semibold text-muted">
                <span className="font-mono tabular-nums">{rows.length}</span> listed
              </p>
            </div>
            <div className="p-2.5 sm:p-3.5">
              <Leaderboard rows={rows} platformLabel={platformLabel} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Chip({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={`sticker ${className}`}>{children}</span>;
}
