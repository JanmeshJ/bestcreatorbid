import Link from "next/link";
import { MousePointerClick, Megaphone, Heart } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export function PitchSection({ clicksSent }: { clicksSent: number }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <Card
        icon={<Heart className="h-5 w-5" />}
        title="Vote with money"
        body="Back your favorite creator and shove them up the board. Fans can bid. Rivals can bid. Anyone can bid."
      />
      <Card
        icon={<Megaphone className="h-5 w-5" />}
        title="Promote your own page"
        body="Put your handle on the internet's most honest ranking. Higher rank. More eyes. More people clicking through to you."
      />
      <Card
        icon={<MousePointerClick className="h-5 w-5" />}
        title={`${formatNumber(clicksSent)} clicks already sent`}
        body="Listings here do not sit still. People click them. That traffic is the proof your bid bought something real."
      />
      <p className="md:col-span-3 pt-2 text-center text-sm font-semibold">
        <Link href="/#bid" className="text-accent hover:underline">
          Put a creator on the board before someone else does
        </Link>
      </p>
    </section>
  );
}

function Card({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-[24px] border border-border bg-card p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-accent">{icon}</div>
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
