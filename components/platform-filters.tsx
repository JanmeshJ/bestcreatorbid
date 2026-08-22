import Link from "next/link";
import { FILTER_PLATFORMS, type PlatformId } from "@/lib/platforms";
import { PlatformIcon } from "@/components/platform-icon";
import { cn } from "@/lib/utils";

export function PlatformFilters({ active }: { active?: PlatformId | "all" }) {
  const current = active || "all";
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar sm:flex-wrap sm:overflow-x-visible">
      <FilterPill href="/" active={current === "all"}>
        All
      </FilterPill>
      {FILTER_PLATFORMS.map((platform) => (
        <FilterPill key={platform.id} href={`/${platform.urlPath}`} active={current === platform.id}>
          <PlatformIcon id={platform.id} size="sm" className="h-4 w-4 rounded" />
          {platform.shortName}
        </FilterPill>
      ))}
    </div>
  );
}

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-bold transition",
        active
          ? "border-transparent bg-gradient-to-b from-accent to-accent-hover text-white shadow-[var(--shadow-glow)]"
          : "border-border bg-card text-foreground hover:-translate-y-0.5 hover:border-accent/40 hover:text-accent"
      )}
    >
      {children}
    </Link>
  );
}
