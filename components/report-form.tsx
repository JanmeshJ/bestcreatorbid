"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/input";

export function ReportForm({ creatorId, handle }: { creatorId: string; handle: string }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(form: FormData, url: string) {
    setError(null);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creatorId,
        requesterName: form.get("name"),
        email: form.get("email"),
        reason: form.get("reason"),
        proof: form.get("proof"),
        message: form.get("message"),
        profileUrl: form.get("profile"),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Could not submit.");
      return;
    }
    setDone(true);
  }

  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <button type="button" className="font-semibold text-muted underline-offset-4 hover:underline" onClick={() => setOpen(true)}>
        Report profile
      </button>
      <Link href="/removal" className="font-semibold text-muted underline-offset-4 hover:underline">
        Are you listed here and want this profile removed?
      </Link>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Report @{handle}</DialogTitle>
          <DialogDescription>Tell us why this listing should be reviewed.</DialogDescription>
          {done ? (
            <p className="mt-4 text-sm font-semibold">Got it. We’ll take a look.</p>
          ) : (
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void submit(new FormData(e.currentTarget), "/api/report");
              }}
            >
              <div>
                <Label htmlFor="name">Your name</Label>
                <Input id="name" name="name" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Input id="reason" name="reason" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="proof">Proof / context</Label>
                <Textarea id="proof" name="proof" className="mt-1" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full">
                Submit report
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
