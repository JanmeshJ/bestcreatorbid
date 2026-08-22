"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { formatUsd, timeAgo } from "@/lib/utils";

type Creator = {
  id: string;
  display_name: string;
  handle: string;
  platform: string;
  slug: string;
  status: string;
  verified: boolean;
};
type Bid = {
  id: string;
  amount_cents: number;
  status: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  creators?: { display_name?: string; handle?: string } | { display_name?: string; handle?: string }[] | null;
};
type Report = { id: string; email: string; reason: string; status: string; created_at: string };

export function AdminBoard({
  bundle,
}: {
  bundle: {
    creators: Creator[];
    bids: Bid[];
    reports: Report[];
    removals: Report[];
    stats: { bidAllCents: number; clicksSent: number; creatorCount: number };
  };
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");

  async function updateCreator(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/creators/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setMessage(res.ok ? "Updated." : json.error || "Failed.");
    if (res.ok) window.location.reload();
  }

  async function merge() {
    const res = await fetch("/api/admin/merge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId, targetId }),
    });
    const json = await res.json();
    setMessage(res.ok ? "Merged." : json.error || "Failed.");
    if (res.ok) window.location.reload();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin";
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <Logo />
        <Button size="sm" variant="outline" onClick={() => void logout()}>
          Log out
        </Button>
      </div>
      <h1 className="mt-6 text-4xl font-black">Admin</h1>
      {message && <p className="mt-3 font-semibold text-accent">{message}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Creators" value={String(bundle.stats.creatorCount)} />
        <Stat label="All-time bids" value={formatUsd(bundle.stats.bidAllCents)} />
        <Stat label="Clicks" value={String(bundle.stats.clicksSent)} />
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-black">Creators</h2>
        <div className="mt-4 overflow-x-auto rounded-3xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted">
              <tr>
                <th className="p-3">Creator</th>
                <th className="p-3">Platform</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bundle.creators.map((creator) => (
                <tr key={creator.id} className="border-b border-border/70">
                  <td className="p-3">
                    <Link href={`/creator/${creator.slug}`} className="font-semibold">
                      {creator.display_name}
                    </Link>
                    <div className="text-xs text-muted">@{creator.handle}</div>
                    <div className="text-[10px] text-muted">{creator.id}</div>
                  </td>
                  <td className="p-3">{creator.platform}</td>
                  <td className="p-3">{creator.status}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => void updateCreator(creator.id, { status: "disabled" })}>
                        Disable
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void updateCreator(creator.id, { status: "removed" })}>
                        Remove
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void updateCreator(creator.id, { status: "active" })}>
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="muted"
                        onClick={() => void updateCreator(creator.id, { verified: !creator.verified })}
                      >
                        {creator.verified ? "Unverify" : "Verify"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-black">Merge duplicates</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input className="h-11 rounded-full border border-border px-4" placeholder="Source UUID" value={sourceId} onChange={(e) => setSourceId(e.target.value)} />
          <input className="h-11 rounded-full border border-border px-4" placeholder="Target UUID" value={targetId} onChange={(e) => setTargetId(e.target.value)} />
          <Button onClick={() => void merge()}>Merge source into target</Button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-black">Bids / payments</h2>
        <div className="mt-4 overflow-x-auto rounded-3xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted">
              <tr>
                <th className="p-3">When</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3">Creator</th>
                <th className="p-3">Stripe</th>
              </tr>
            </thead>
            <tbody>
              {bundle.bids.map((bid) => {
                const creator = Array.isArray(bid.creators) ? bid.creators[0] : bid.creators;
                return (
                  <tr key={bid.id} className="border-b border-border/70">
                    <td className="p-3">{timeAgo(bid.created_at)}</td>
                    <td className="p-3 font-bold">{formatUsd(bid.amount_cents)}</td>
                    <td className="p-3">{bid.status}</td>
                    <td className="p-3">{creator?.display_name || creator?.handle || "pending"}</td>
                    <td className="p-3 text-xs">
                      {bid.stripe_checkout_session_id}
                      {bid.stripe_payment_intent_id ? ` · ${bid.stripe_payment_intent_id}` : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-black">Reports</h2>
          <div className="mt-3 space-y-2">
            {bundle.reports.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-card p-3 text-sm">
                <p className="font-semibold">{item.reason}</p>
                <p className="text-muted">{item.email} · {item.status} · {timeAgo(item.created_at)}</p>
              </div>
            ))}
            {bundle.reports.length === 0 && <p className="text-sm text-muted">No reports.</p>}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black">Removal requests</h2>
          <div className="mt-3 space-y-2">
            {bundle.removals.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-card p-3 text-sm">
                <p className="font-semibold">{item.reason}</p>
                <p className="text-muted">{item.email} · {item.status} · {timeAgo(item.created_at)}</p>
              </div>
            ))}
            {bundle.removals.length === 0 && <p className="text-sm text-muted">No removal requests.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}
