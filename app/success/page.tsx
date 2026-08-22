"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

function SuccessInner() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState("processing");
  const [slug, setSlug] = useState<string | null>(null);
  const celebrated = useRef(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    const poll = async () => {
      const res = await fetch(`/api/checkout/status?session_id=${sessionId}`);
      const json = await res.json();
      if (cancelled) return;
      setStatus(json.status || "unknown");
      const creator = Array.isArray(json.creator) ? json.creator[0] : json.creator;
      if (creator?.slug) setSlug(creator.slug);
    };
    void poll();
    const id = window.setInterval(poll, 2000);
    const timeout = window.setTimeout(() => {
      window.clearInterval(id);
      setStatus((prev) => (prev === "pending" || prev === "processing" ? "delayed" : prev));
    }, 45000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.clearTimeout(timeout);
    };
  }, [sessionId]);

  useEffect(() => {
    if (status !== "succeeded" || celebrated.current) return;
    celebrated.current = true;
    const colors = ["#ff5a1f", "#7c3aed", "#0ea5e9", "#ec4899", "#16a34a", "#efa315"];
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors });
    window.setTimeout(() => confetti({ particleCount: 50, spread: 100, origin: { y: 0.5 }, colors }), 200);
  }, [status]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 text-center">
      <div className="flex justify-center">
        <Logo />
      </div>
      <h1 className="mt-8 text-4xl font-black tracking-tight">
        {status === "succeeded" ? "You're on the board." : "Payment received."}
      </h1>
      <p className="mt-3 text-muted">
        {status === "succeeded"
          ? "Stripe confirmed it. Rankings are live."
          : status === "delayed"
            ? "Stripe has the payment. Ranking can take a few extra seconds while the webhook lands. We never apply a bid from this page."
            : "Waiting for the Stripe webhook to confirm. Rankings update only after that."}
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Button asChild>
          <Link href={slug ? `/creator/${slug}` : "/"}>{slug ? "See profile" : "Back to the board"}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/wall">The Wall</Link>
        </Button>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessInner />
    </Suspense>
  );
}
