"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export function RemovalForm() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return <p className="mt-8 font-semibold">Request received. We&apos;ll review it.</p>;
  }

  return (
    <form
      className="mt-8 space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const res = await fetch("/api/removal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileUrl: form.get("profile"),
            requesterName: form.get("name"),
            email: form.get("email"),
            reason: form.get("reason"),
            proof: form.get("proof"),
            message: form.get("message"),
          }),
        });
        const json = await res.json();
        if (!res.ok) setError(json.error || "Could not submit.");
        else setDone(true);
      }}
    >
      <Field name="profile" label="Profile / URL" required />
      <Field name="name" label="Your name" required />
      <Field name="email" label="Email" type="email" required />
      <Field name="reason" label="Reason" required />
      <div>
        <Label htmlFor="proof">Proof / context</Label>
        <Textarea id="proof" name="proof" className="mt-1" />
      </div>
      <div>
        <Label htmlFor="message">Optional message</Label>
        <Textarea id="message" name="message" className="mt-1" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full">
        Submit request
      </Button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} className="mt-1" />
    </div>
  );
}
