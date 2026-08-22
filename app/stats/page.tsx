import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteStats } from "@/lib/data";
import { formatNumber, formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stats" };

export default async function StatsPage() {
  const stats = await getSiteStats();
  const items = [
    { label: "Creators online", value: formatNumber(stats.onlineCount), tone: "bg-lime-soft text-lime" },
    { label: "Bid today", value: formatUsd(stats.bidTodayCents), tone: "bg-accent-soft text-accent" },
    { label: "Bid all-time", value: formatUsd(stats.bidAllCents), tone: "bg-grape-soft text-grape" },
    { label: "Clicks sent", value: formatNumber(stats.clicksSent), tone: "bg-sky-soft text-sky" },
    { label: "Creators on the board", value: formatNumber(stats.creatorCount), tone: "bg-bubble-soft text-bubble" },
  ];

  return (
    <>
      <SiteHeader
        onlineCount={stats.onlineCount}
        bidTodayCents={stats.bidTodayCents}
        clicksSent={stats.clicksSent}
      />
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-accent">Receipts</p>
        <h1 className="mt-3 text-[32px] font-black leading-tight tracking-tight sm:text-4xl">
          The numbers, with no{" "}
          <span className="font-marker text-accent">algorithm</span> to hide behind.
        </h1>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.label} className="panel card-hover p-5">
              <span className={`sticker ${item.tone}`}>{item.label}</span>
              <p className="mt-3 font-mono text-3xl font-black tabular-nums">{item.value}</p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
