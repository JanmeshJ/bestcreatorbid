import { activityCompact } from "@/lib/activity";
import type { ActivityEvent, LeaderboardRow } from "@/lib/supabase/types";
import { formatNumber, timeAgoShort } from "@/lib/utils";

export function BoardPulse({
  rows,
  activity,
}: {
  rows: (LeaderboardRow & { filter_rank: number })[];
  activity: ActivityEvent[];
}) {
  const trending = [...rows].sort((a, b) => b.click_count - a.click_count)[0];
  const latest = activity[0];
  const showTrending = trending && trending.click_count > 0;
  if (!showTrending && !latest) return null;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {showTrending && (
        <PulseCard
          label="Trending right now"
          value={trending.creators.display_name || trending.creators.handle}
          meta={`${formatNumber(trending.click_count)} clicks`}
          className="bg-bubble-soft text-bubble"
        />
      )}
      {latest && (
        <PulseCard
          label="Latest move"
          value={activityCompact(latest.metadata || {})}
          meta={timeAgoShort(latest.created_at)}
          className="bg-grape-soft text-grape"
        />
      )}
    </div>
  );
}

function PulseCard({
  label,
  value,
  meta,
  className,
}: {
  label: string;
  value: string;
  meta: string;
  className: string;
}) {
  return (
    <div className={`rounded-2xl px-3.5 py-3 ${className}`}>
      <p className="text-[11px] font-extrabold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 flex items-baseline justify-between gap-2 text-foreground">
        <span className="min-w-0 truncate text-sm font-extrabold">{value}</span>
        <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums text-muted">{meta}</span>
      </p>
    </div>
  );
}
