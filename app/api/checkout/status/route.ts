import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session." }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data: bid } = await admin
    .from("bids")
    .select("id, status, amount_cents, creator_id, creators(slug, handle, display_name, platform)")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  if (!bid) {
    return NextResponse.json({ status: "unknown" });
  }

  return NextResponse.json({
    status: bid.status,
    amountCents: bid.amount_cents,
    creator: bid.creators,
  });
}
