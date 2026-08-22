import { AppShell } from "@/components/app-shell";
import { BoardPage } from "@/components/board-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getActivity, getLeaderboard, getSiteStats, getTopBidCents } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stats, rows, activity, leaderCents] = await Promise.all([
    getSiteStats(),
    getLeaderboard(),
    getActivity(),
    getTopBidCents(),
  ]);

  return (
    <AppShell activity={activity}>
      <SiteHeader
        onlineCount={stats.onlineCount}
        bidTodayCents={stats.bidTodayCents}
        clicksSent={stats.clicksSent}
      />
      <BoardPage rows={rows} activity={activity} leaderCents={leaderCents} activePlatform="all" />
      <SiteFooter />
    </AppShell>
  );
}
