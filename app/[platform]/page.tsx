import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BoardPage } from "@/components/board-page";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getActivity, getAllBidTotals, getLeaderboard, getSiteStats, getTopBidCents } from "@/lib/data";
import { getPlatform, isPlatformId } from "@/lib/platforms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ platform: string }> }) {
  const { platform: raw } = await params;
  const platform = isPlatformId(raw) ? getPlatform(raw) : null;
  if (!platform) return { title: "Leaderboard" };
  return {
    title: `${platform.name} leaderboard`,
    description: `${platform.name} creators ranked by money on bestcreatorbid.lol.`,
    alternates: { canonical: `/${platform.urlPath}` },
  };
}

export default async function PlatformBoardPage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform: raw } = await params;
  if (!isPlatformId(raw) || !getPlatform(raw)) notFound();
  const platform = getPlatform(raw)!;
  const [stats, rows, activity, leaderCents, boardTotals] = await Promise.all([
    getSiteStats(),
    getLeaderboard(platform.id),
    getActivity(),
    getTopBidCents(),
    // rows above is platform-filtered, but ranking (and the bidding widget's
    // rank projection) is always site-wide, so this needs the full set.
    getAllBidTotals(),
  ]);

  return (
    <AppShell activity={activity}>
      <SiteHeader
        onlineCount={stats.onlineCount}
        bidTodayCents={stats.bidTodayCents}
        clicksSent={stats.clicksSent}
      />
      <BoardPage
        rows={rows}
        activity={activity}
        leaderCents={leaderCents}
        boardTotals={boardTotals}
        activePlatform={platform.id}
        platformLabel={platform.name}
      />
      <SiteFooter />
    </AppShell>
  );
}
