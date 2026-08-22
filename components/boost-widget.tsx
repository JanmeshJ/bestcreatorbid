"use client";

import { BID_PRESETS, MIN_BID_CENTS } from "@/lib/constants";
import type { BoardTotal } from "@/lib/data";
import { amountToOutrank, centsToDollars } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PaymentNotice } from "@/components/payment-notice";
import { formatUsd } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { Creator } from "@/lib/supabase/types";

export function BoostWidget({
  creator,
  currentTotal,
  leaderCents,
  boardTotals,
}: {
  creator: Creator;
  currentTotal: number;
  leaderCents: number;
  boardTotals: BoardTotal[];
}) {
  const toFirst = centsToDollars(amountToOutrank(leaderCents, currentTotal));
  const [amount, setAmount] = useState(Math.min(25, toFirst));
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reactive to the amount actually selected, not a fixed target computed
  // once on the server — otherwise the headline can claim an outcome that
  // doesn't match whatever the slider is currently set to.
  const projectedRank = useMemo(() => {
    const nextTotal = currentTotal + amount * 100;
    let rank = 1;
    for (const row of boardTotals) {
      if (row.creatorId === creator.id) continue;
      if (row.cents >= nextTotal) rank += 1;
    }
    return rank;
  }, [amount, currentTotal, boardTotals, creator.id]);

  const resultCopy = projectedRank === 1 ? "They'll take #1" : `They'll land at #${projectedRank}`;

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: creator.platform,
          handle: creator.handle,
          displayName: creator.display_name,
          bio: creator.bio,
          avatarUrl: creator.avatar_url,
          profileUrl: creator.profile_url,
          amountDollars: amount,
          existingCreatorId: creator.id,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setError(json.error || "Checkout failed.");
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("Could not start checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel p-6">
      <p className="text-sm font-semibold text-muted">Push them higher</p>
      <p className="mt-2 text-2xl font-black">{resultCopy}</p>
      {projectedRank !== 1 && (
        <p className="mt-1 text-sm text-accent-strong">
          <span className="font-mono tabular-nums">${toFirst}</span> to take #1
        </p>
      )}
      <p className="mt-3 text-sm text-muted">
        Anyone can back a creator. Every successful bid increases their leaderboard total.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {BID_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setAmount(preset)}
            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
              amount === preset ? "border-accent bg-accent-soft text-accent" : "border-border bg-white"
            }`}
          >
            +${preset}
          </button>
        ))}
        <Input
          type="number"
          min={MIN_BID_CENTS / 100}
          value={amount}
          onChange={(e) => setAmount(Math.max(MIN_BID_CENTS / 100, Number(e.target.value) || 0))}
          className="h-9 w-24 rounded-full px-3 font-mono tabular-nums"
        />
      </div>
      <Button className="mt-5 w-full" size="lg" onClick={() => setOpen(true)}>
        Add <span key={amount} className="inline-block animate-bid-pop font-mono tabular-nums">{formatUsd(amount * 100)}</span>
      </Button>
      <PaymentNotice className="mt-3" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Back {creator.display_name}</DialogTitle>
          <DialogDescription>This payment increases their cumulative bid. Creators are not paid.</DialogDescription>
          <p className="mt-4 font-mono text-3xl font-black tabular-nums">{formatUsd(amount * 100)}</p>
          <p className="mt-1 text-sm text-muted">
            Result if successful: <span className="font-semibold text-foreground">{resultCopy}</span>
          </p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <Button className="mt-4 w-full" disabled={loading} onClick={() => void pay()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay $${amount}`}
          </Button>
          <PaymentNotice className="mt-3" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
