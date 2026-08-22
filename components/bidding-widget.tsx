"use client";

import { ArrowRight, ArrowUpRight, ChevronDown, Globe, Loader2, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PaymentNotice } from "@/components/payment-notice";
import { PlatformIcon } from "@/components/platform-icon";
import { CreatorAvatar } from "@/components/creator-avatar";
import { useBidFlow } from "@/components/bid-flow-context";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { BID_PRESETS, MIN_BID_CENTS, TAKE_SPOT_INCREMENT_CENTS } from "@/lib/constants";
import { amountToTakeFirst, centsToDollars } from "@/lib/money";
import { ENABLED_PLATFORMS, HANDLE_AFFIX, PLATFORMS, displayHandle, type PlatformId } from "@/lib/platforms";
import { formatUsd } from "@/lib/utils";

type Step = "compose" | "preview";

type ProfileState = {
  platform: PlatformId;
  handle: string;
  displayHandle: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  profileUrl: string;
  slug?: string;
  existing?: boolean;
  rank?: number | null;
  totalBidCents?: number;
  fallbackMessage?: string | null;
};

export function BiddingWidget({
  leaderCents,
  defaultAmountDollars,
}: {
  leaderCents: number;
  defaultAmountDollars?: number;
}) {
  const takeFirst = centsToDollars(amountToTakeFirst(leaderCents));
  const { intent, bump } = useBidFlow();
  const [step, setStep] = useState<Step>("compose");
  const [platform, setPlatform] = useState<PlatformId>("youtube");
  const [input, setInput] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [amount, setAmount] = useState(defaultAmountDollars || takeFirst);
  const [custom, setCustom] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [outrankHint, setOutrankHint] = useState<string | null>(null);

  useEffect(() => {
    if (!intent) return;
    setAmount(intent.amountDollars);
    setCustom(false);
    if (intent.handle) {
      setOutrankHint(
        intent.rank === 1
          ? `Take #1 for $${intent.amountDollars}`
          : `$${intent.amountDollars} puts you above ${intent.handle}`
      );
    }
  }, [intent, bump]);

  async function lookup() {
    setLoading(true);
    setLookupError(null);
    try {
      const res = await fetch("/api/creators/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, input }),
      });
      const json = await res.json();
      if (!res.ok) {
        setLookupError(json.error || "Could not find that profile.");
        return;
      }
      const p = json.profile;
      setProfile({
        platform: p.platform,
        handle: p.handle,
        displayHandle: p.displayHandle,
        displayName: p.displayName || p.displayHandle.replace(/^@/, ""),
        bio: p.bio || "",
        avatarUrl: p.avatarUrl || "",
        profileUrl: p.profileUrl,
        slug: json.slug || json.creator?.slug,
        existing: json.existing,
        rank: json.rank,
        totalBidCents: json.totalBidCents,
        fallbackMessage: json.fallbackMessage,
      });
      if (json.existing && typeof json.totalBidCents === "number") {
        const needed = Math.max(MIN_BID_CENTS / 100, takeFirst - Math.round(json.totalBidCents / 100));
        setAmount(needed);
      }
      setStep("preview");
    } catch {
      setLookupError("Lookup failed. You can still continue with a name and photo.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadAvatar(file: File) {
    const form = new FormData();
    form.set("file", file);
    const res = await fetch("/api/creators/upload", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) {
      setLookupError(json.error || "Upload failed.");
      return;
    }
    setProfile((prev) => (prev ? { ...prev, avatarUrl: json.url } : prev));
  }

  async function startCheckout() {
    if (!profile) return;
    setCheckoutError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: profile.platform,
          handle: profile.handle,
          displayName: profile.displayName,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl || null,
          profileUrl: profile.profileUrl,
          amountDollars: amount,
          existingCreatorId: profile.existing ? undefined : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setCheckoutError(json.error || "Checkout failed.");
        return;
      }
      window.location.href = json.url;
    } catch {
      setCheckoutError("Could not start Stripe Checkout.");
    } finally {
      setLoading(false);
    }
  }

  const resultCopy = useMemo(() => {
    const nextTotal = (profile?.existing ? profile.totalBidCents ?? 0 : 0) + amount * 100;
    if (nextTotal > leaderCents) return "You'll take #1";
    return "You'll join the board";
  }, [amount, leaderCents, profile]);

  const claimRank = intent?.rank || 1;
  const affix = HANDLE_AFFIX[platform];
  const handlePlaceholder = useMemo(() => {
    if (platform === "other") return "yoursite.com";
    let raw = PLATFORMS[platform].placeholder.replace(/^@/, "").trim();
    // the affix is already rendered beside the field, so don't repeat it
    if (affix.suffix && raw.endsWith(affix.suffix)) raw = raw.slice(0, -affix.suffix.length);
    if (affix.prefix && raw.startsWith(affix.prefix)) raw = raw.slice(affix.prefix.length);
    return raw || "yourhandle";
  }, [platform, affix]);

  return (
    <div id="bid">
      {step === "compose" && (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void lookup();
          }}
        >
          <div className="flex items-center justify-between gap-2 rounded-3xl bg-accent-soft/70 px-4 py-3.5">
            <p className="text-sm font-extrabold leading-tight sm:text-base">
              Take #{claimRank}
              <span className="block text-[11px] font-bold uppercase tracking-wider text-accent-strong/70">
                for
              </span>
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm transition hover:bg-white active:scale-90"
                onClick={() => setAmount((value) => Math.max(MIN_BID_CENTS / 100, value - 1))}
                aria-label="Decrease bid"
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="min-w-[5rem] text-center text-[34px] font-black leading-none tracking-tight text-accent sm:text-[38px]">
                <span key={amount} className="inline-block animate-bid-pop font-mono tabular-nums">
                  ${amount}
                </span>
              </div>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg shadow-sm transition hover:bg-white active:scale-90"
                onClick={() => setAmount((value) => value + 1)}
                aria-label="Increase bid"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <p className="text-[12.5px] leading-snug text-muted">
            New spots start at ${MIN_BID_CENTS / 100}. Match a price and you land just under them. Beat it by $
            {TAKE_SPOT_INCREMENT_CENTS / 100} and you take the spot.
          </p>
          {outrankHint && (
            <p className="rounded-2xl bg-lime-soft px-3.5 py-2.5 text-sm font-bold text-lime">{outrankHint}</p>
          )}

          <div className="flex h-13 items-center rounded-full border border-border bg-white pl-3 pr-1.5 py-1 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
            {affix.prefix ? (
              <span className="shrink-0 pl-0.5 text-[13.5px] font-medium text-muted">{affix.prefix}</span>
            ) : (
              <Globe className="h-4 w-4 shrink-0 text-muted" />
            )}
            <input
              value={input}
              placeholder={handlePlaceholder}
              onChange={(e) => setInput(e.target.value)}
              className="w-0 min-w-0 flex-1 bg-transparent px-1 text-[15px] outline-none placeholder:text-muted"
            />
            {affix.suffix && (
              <span className="shrink-0 pr-1 text-[13.5px] font-medium text-muted">{affix.suffix}</span>
            )}
            <div className="relative shrink-0">
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformId)}
                className="h-9 max-w-[6.75rem] appearance-none rounded-full bg-stone-100 py-0 pl-2.5 pr-7 text-[13px] font-semibold outline-none"
                aria-label="Platform"
              >
                {ENABLED_PLATFORMS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.shortName}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            </div>
          </div>
          {lookupError && (
            <p className="rounded-2xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-600">{lookupError}</p>
          )}
          <Button type="submit" className="w-full rounded-2xl" size="lg" disabled={!input.trim() || loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Enter the leaderboard <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
          <p className="text-center text-[12.5px] leading-relaxed text-muted">
            Already on the board? Enter the same handle and raise the bid.
          </p>
        </form>
      )}

      {step === "preview" && profile && (
        <div className="animate-fade-slide-in space-y-5">
          <button
            type="button"
            className="text-xs font-semibold text-muted hover:text-foreground"
            onClick={() => setStep("compose")}
          >
            ← Edit handle
          </button>

          {profile.existing && (
            <p className="text-sm leading-relaxed text-accent-strong">
              Already on the board at {profile.rank ? `#${profile.rank}` : "unranked"} ·{" "}
              <span className="font-mono tabular-nums">{formatUsd(profile.totalBidCents ?? 0)}</span>. Anyone can add
              to this total.
            </p>
          )}

          <div className="flex gap-3">
            <label className="shrink-0 cursor-pointer">
              <CreatorAvatar name={profile.displayName} src={profile.avatarUrl} size="lg" rounded="lg" />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadAvatar(file);
                }}
              />
            </label>
            <div className="min-w-0 flex-1">
              <Input
                value={profile.displayName}
                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                className="h-10 font-bold"
              />
              <p className="mt-1 truncate text-sm text-muted">{displayHandle(profile.platform, profile.handle)}</p>
              <div className="mt-2 flex items-center gap-2 text-xs font-semibold">
                <PlatformIcon id={profile.platform} size="sm" />
                {ENABLED_PLATFORMS.find((item) => item.id === profile.platform)?.name}
              </div>
            </div>
          </div>
          {profile.fallbackMessage && <p className="text-xs text-muted">{profile.fallbackMessage}</p>}
          <Textarea
            className="min-h-20"
            maxLength={180}
            placeholder="Short public bio"
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          />
          <a
            href={profile.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-accent"
          >
            View profile <ArrowUpRight className="h-4 w-4" />
          </a>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{profile.existing ? "Raise your bid" : "Your bid"}</p>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border transition hover:bg-stone-50 active:scale-90"
                onClick={() => setAmount((value) => Math.max(MIN_BID_CENTS / 100, value - 1))}
              >
                <Minus className="h-4 w-4" />
              </button>
              <div className="text-5xl font-black tracking-tight">
                <span key={amount} className="inline-block animate-bid-pop font-mono tabular-nums">
                  ${amount}
                </span>
              </div>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border transition hover:bg-stone-50 active:scale-90"
                onClick={() => setAmount((value) => value + 1)}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {BID_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAmount(preset);
                    setCustom(false);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                    amount === preset && !custom
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border bg-white hover:bg-stone-50"
                  }`}
                >
                  ${preset}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustom(true)}
                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  custom ? "border-accent bg-accent-soft text-accent" : "border-border bg-white hover:bg-stone-50"
                }`}
              >
                Custom
              </button>
            </div>
            {custom && (
              <Input
                type="number"
                min={MIN_BID_CENTS / 100}
                className="mt-3"
                value={amount}
                onChange={(e) => setAmount(Math.max(MIN_BID_CENTS / 100, Number(e.target.value) || 0))}
              />
            )}
          </div>

          <Button className="w-full rounded-[18px]" size="lg" onClick={() => setSummaryOpen(true)}>
            {profile.existing ? "Raise your bid" : "Enter the leaderboard"}
          </Button>
          <p className="text-center text-[12px] text-muted">
            Creators are not paid.{" "}
            <Link href="/rules" className="font-semibold text-accent underline-offset-2 hover:underline">
              Read the rules
            </Link>
          </p>
        </div>
      )}

      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent>
          <DialogTitle>Confirm your bid</DialogTitle>
          <DialogDescription>Ranking updates only after Stripe confirms payment. Creators are not paid.</DialogDescription>
          {profile && (
            <div className="mt-4 space-y-3 text-sm">
              <Row label="Creator" value={displayHandle(profile.platform, profile.handle)} />
              <Row label="Platform" value={ENABLED_PLATFORMS.find((item) => item.id === profile.platform)?.name || ""} />
              <Row label="Bid" value={formatUsd(amount * 100)} />
              <Row label="Result if successful" value={resultCopy} />
            </div>
          )}
          {checkoutError && <p className="mt-3 text-sm text-red-600">{checkoutError}</p>}
          <Button className="mt-5 w-full" size="lg" disabled={loading} onClick={() => void startCheckout()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay $${amount} & ${resultCopy.toLowerCase().includes("take") ? "take #1" : "join"}`}
          </Button>
          <PaymentNotice className="mt-3" />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
