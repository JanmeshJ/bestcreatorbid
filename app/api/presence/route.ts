import { NextResponse } from "next/server";
import { hashValue } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  const sessionId = hashValue(`${ip}:${ua}`).slice(0, 32);
  const admin = createAdminClient();
  await admin.from("presence").upsert({
    session_id: sessionId,
    last_seen: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}
