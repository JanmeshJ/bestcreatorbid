import { AppShell } from "@/components/app-shell";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { activityCopy, activityLabel } from "@/lib/activity";
import { getActivity, getSiteStats } from "@/lib/data";
import { formatUsd, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "The Wall" };

export default async function WallPage() {
  const [stats, activity] = await Promise.all([getSiteStats(), getActivity(80)]);
  return (
    <AppShell activity={activity}>
      <SiteHeader
        onlineCount={stats.onlineCount}
        bidTodayCents={stats.bidTodayCents}
        clicksSent={stats.clicksSent}
      />
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-accent">Public activity</p>
        <h1 className="mt-3 text-[32px] font-black leading-tight tracking-tight sm:text-4xl">
          The <span className="font-marker text-accent">Wall</span>
        </h1>
        <p className="mt-3 text-muted">Every successful bid, rank jump, and ego spike. In order.</p>

        <div className="panel mt-8 divide-y divide-border overflow-hidden">
          {activity.length === 0 && (
            <div className="px-4 py-14 text-center">
              <p className="font-extrabold">The wall is blank.</p>
              <p className="mt-1 text-sm text-muted">Pay to make the first mark.</p>
            </div>
          )}
          {activity.map((event) => (
            <article
              key={event.id}
              className="flex items-start justify-between gap-3 px-4 py-3.5 transition hover:bg-black/[0.02]"
            >
              <div className="min-w-0">
                <p className="text-[10px] font-black tracking-[0.16em] text-accent">{activityLabel(event.type)}</p>
                <p className="mt-1 font-bold leading-snug">{activityCopy(event.type, event.metadata || {})}</p>
                {typeof event.metadata?.amount_cents === "number" && (
                  <p className="mt-1 font-mono text-sm font-black tabular-nums text-lime">
                    +{formatUsd(event.metadata.amount_cents as number)}
                  </p>
                )}
              </div>
              <p className="shrink-0 pt-4 text-xs font-semibold text-muted">{timeAgo(event.created_at)}</p>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </AppShell>
  );
}
