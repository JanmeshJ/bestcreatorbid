"use client";

import { useEffect, useMemo, useState } from "react";
import { activityCopy, activityLabel } from "@/lib/activity";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/config";
import type { ActivityEvent } from "@/lib/supabase/types";
import { timeAgo } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { formatUsd } from "@/lib/utils";

export function LiveActivity({ initial }: { initial: ActivityEvent[] }) {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState(initial);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured()) return;
    const supabase = createClient();
    const channel = supabase
      .channel("chaos-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_events" }, (payload) => {
        setEvents((prev) => [payload.new as ActivityEvent, ...prev].slice(0, 50));
        setPulse(true);
        window.setTimeout(() => setPulse(false), 1200);
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const latest = events[0];
  const preview = useMemo(
    () => (latest ? activityCopy(latest.type, latest.metadata || {}) : "Waiting for the first bid..."),
    [latest]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed bottom-4 right-4 z-40 flex max-w-[min(90vw,22rem)] items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2.5 text-left text-sm font-semibold shadow-[var(--shadow-lift)] transition hover:-translate-y-0.5 ${
          pulse ? "ring-2 ring-accent" : ""
        }`}
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
        </span>
        <span className="truncate">
          <span className="mr-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-black text-white">LIVE</span>
          <span className="font-medium text-muted">{preview}</span>
        </span>
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <div className="border-b border-border px-5 py-4">
            <SheetTitle>Live board</SheetTitle>
            <p className="text-sm text-muted">Public activity only. Payers stay private unless they opt in.</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {events.length === 0 && <p className="text-sm text-muted">Quiet for now. A bid changes that.</p>}
            {events.map((event) => (
              <div key={event.id} className="rounded-2xl border border-border bg-white p-3">
                <p className="text-[10px] font-black tracking-[0.16em] text-accent">{activityLabel(event.type)}</p>
                <p className="mt-1 font-semibold">{activityCopy(event.type, event.metadata || {})}</p>
                {typeof event.metadata?.amount_cents === "number" && (
                  <p className="mt-1 font-mono text-sm font-bold tabular-nums text-accent">
                    +{formatUsd(event.metadata.amount_cents as number)}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted">{timeAgo(event.created_at)}</p>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
