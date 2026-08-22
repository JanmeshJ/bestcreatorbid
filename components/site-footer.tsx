import Link from "next/link";
import { CountUp } from "@/components/count-up";
import { getSiteStats } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

const LINKS = [
  { href: "/rules", label: "Rules" },
  { href: "/stats", label: "Stats" },
  { href: "/wall", label: "The Wall" },
  { href: "/removal", label: "Removal" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/cookies", label: "Cookies" },
];

export async function SiteFooter() {
  const stats = await getSiteStats();
  const dollars = Math.round(stats.bidAllCents / 100);

  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-16">
      <div className="panel overflow-hidden px-6 py-10 text-center">
        <p className="text-[13px] font-semibold text-muted">This board has taken</p>
        <p className="mt-1 font-mono text-[52px] font-black leading-none tracking-tight tabular-nums sm:text-6xl">
          <span className="text-accent">$</span>
          <CountUp value={dollars} />
        </p>
        <p className="font-marker mt-3 text-lg text-accent">and counting.</p>

        <p className="mt-4 text-[13px] leading-relaxed text-muted">
          in successful bids · <span className="font-mono tabular-nums">{formatNumber(stats.clicksSent)}</span> clicks
          sent ·{" "}
          <span className="font-mono tabular-nums">{formatNumber(stats.creatorCount)}</span> creators listed
        </p>

        <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-[13px] font-bold text-muted transition hover:bg-accent-soft hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <p className="mt-6 text-[12.5px] text-muted">
          Creators listed here are not paid and did not opt in.{" "}
          <Link href="/removal" className="font-bold text-accent hover:underline">
            Request removal
          </Link>
        </p>

        <p className="mt-4 text-[12.5px] text-muted">
          Homage to{" "}
          <a
            href="https://outbid.lol"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-accent hover:underline"
          >
            outbid.lol
          </a>
        </p>
      </div>
    </footer>
  );
}
