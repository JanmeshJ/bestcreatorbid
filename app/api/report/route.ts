import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiErrorHandling } from "@/lib/api-error";
import { hashValue, hitRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const Body = z.object({
  creatorId: z.string().uuid().optional(),
  requesterName: z.string().min(1).max(80),
  email: z.string().email(),
  reason: z.string().min(3).max(500),
  proof: z.string().max(1000).optional(),
  message: z.string().max(1000).optional(),
});

export const POST = withApiErrorHandling(async (req: Request) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = await hitRateLimit(`report:${hashValue(ip)}`, 8, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many reports." }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Fill in the required fields." }, { status: 400 });
  }
  const admin = createAdminClient();
  const { error } = await admin.from("reports").insert({
    creator_id: parsed.data.creatorId ?? null,
    requester_name: parsed.data.requesterName,
    email: parsed.data.email,
    reason: parsed.data.reason,
    proof: parsed.data.proof ?? null,
    message: parsed.data.message ?? null,
  });
  if (error) {
    return NextResponse.json({ error: "Could not save the report." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
});
