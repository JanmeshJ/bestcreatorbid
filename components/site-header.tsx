"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FILTER_PLATFORMS } from "@/lib/platforms";
import { Logo } from "@/components/logo";
import { formatNumber, formatUsd } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function SiteHeader({
  onlineCount,
  bidTodayCents,
  clicksSent,
}: {
  onlineCount: number;
  bidTodayCents: number;
  clicksSent: number;
}) {
  const pathname = usePathname();
  const onLeaderboard =
    pathname === "/" || FILTER_PLATFORMS.some((platform) => pathname === `/${platform.urlPath}`);
  const links = [
    { href: "/", label: "Leaderboard", active: onLeaderboard },
    { href: "/wall", label: "The Wall", active: pathname === "/wall" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href="/" className="min-w-0 shrink-0">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-semibold transition",
                  link.active
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-black/[0.04] hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            <Link
              href="/rules"
              className={cn(
                "rounded-full px-3 py-2 text-sm font-bold transition",
                pathname === "/rules"
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-black/[0.04] hover:text-foreground"
              )}
            >
              Rules
            </Link>
            <Link
              href={onLeaderboard ? "#bid" : "/#bid"}
              className="rounded-full bg-gradient-to-b from-accent to-accent-hover px-4 py-2.5 text-sm font-extrabold text-white shadow-[var(--shadow-glow)] transition hover:brightness-105 active:scale-[0.97]"
            >
              Join &amp; bid
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 no-scrollbar sm:gap-2">
          <StatPill tone="lime" dot>
            <span className="font-mono tabular-nums">{formatNumber(onlineCount)}</span> watching
          </StatPill>
          <StatPill tone="accent">
            <span className="font-mono tabular-nums">{formatUsd(bidTodayCents)}</span> bid today
          </StatPill>
          <StatPill tone="sky">
            <span className="font-mono tabular-nums">{formatNumber(clicksSent)}</span> clicks sent
          </StatPill>
          <Link
            href="/stats"
            className="shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold text-muted transition hover:text-accent sm:text-xs"
          >
            Full stats →
          </Link>
        </div>
      </div>
    </header>
  );
}

const TONES = {
  lime: "bg-lime-soft text-lime",
  accent: "bg-accent-soft text-accent-strong",
  sky: "bg-sky-soft text-sky",
} as const;

function StatPill({
  tone,
  dot = false,
  children,
}: {
  tone: keyof typeof TONES;
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold sm:text-xs",
        TONES[tone]
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
