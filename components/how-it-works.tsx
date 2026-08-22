import { formatUsd } from "@/lib/utils";
import { amountToTakeFirst, centsToDollars } from "@/lib/money";
import { MIN_BID_CENTS } from "@/lib/constants";

export function HowItWorks({ leaderCents }: { leaderCents: number }) {
  const takeFirst = centsToDollars(amountToTakeFirst(leaderCents));
  const minBid = MIN_BID_CENTS / 100;
  return (
    <section className="rounded-[28px] border border-border bg-card/80 p-5 shadow-[0_12px_40px_rgba(28,25,23,0.05)] sm:p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">How ranking works</p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Step n="01" title={`$${minBid} gets you on the board`}>
          You do not need to beat #1. Any successful bid puts a creator on the leaderboard at whatever rank that total can hold.
        </Step>
        <Step n="02" title="Hover a row to see the price">
          Taking someone else&apos;s place costs $1 more than their current total. The exact number appears when you hover any listing.
        </Step>
        <Step n="03" title={`${formatUsd(takeFirst * 100)} takes #1 right now`}>
          Number one only moves if you pay at least $1 more than the current leader. Until then, they keep the crown.
        </Step>
      </div>
    </section>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-stone-50/80 p-4">
      <p className="text-[11px] font-black tracking-widest text-accent">{n}</p>
      <p className="mt-2 text-base font-black leading-snug">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}
