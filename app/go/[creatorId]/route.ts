import { NextResponse } from "next/server";
import { hashValue } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

function isSafeProfileUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || host === "127.0.0.1") return false;
    return true;
  } catch {
    return false;
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ creatorId: string }> }
) {
  const { creatorId } = await context.params;
  const admin = createAdminClient();
  const { data: creator } = await admin
    .from("creators")
    .select("id, profile_url, status")
    .eq("id", creatorId)
    .maybeSingle();

  if (!creator || creator.status !== "active" || !isSafeProfileUrl(creator.profile_url)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  const session = req.headers.get("x-forwarded-for") || ua;
  const source = new URL(req.url).searchParams.get("src") || "leaderboard";

  await admin.rpc("record_outbound_click", {
    p_creator_id: creator.id,
    p_source: source.slice(0, 40),
    p_session_hash: hashValue(session),
    p_ip_hash: hashValue(ip),
  });

  return NextResponse.redirect(creator.profile_url, { status: 302 });
}
