import { NextResponse } from "next/server";
import { z } from "zod";
import { getPlatform, isPlatformId, resolveCreatorInput } from "@/lib/platforms";
import { lookupPublicProfile } from "@/lib/profile-providers";
import { hashValue, hitRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

const Body = z.object({
  platform: z.string(),
  input: z.string().min(1).max(300),
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = await hitRateLimit(`lookup:${hashValue(ip)}`, 30, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many lookups. Slow down a second." }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !isPlatformId(parsed.data.platform)) {
    return NextResponse.json({ error: "Choose a platform and enter a handle." }, { status: 400 });
  }

  const platform = getPlatform(parsed.data.platform);
  if (!platform) {
    return NextResponse.json({ error: "That platform is not supported yet." }, { status: 400 });
  }

  const resolved = resolveCreatorInput(platform.id, parsed.data.input);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("creators")
    .select("*, leaderboard_entries(*)")
    .eq("platform", resolved.platform.id)
    .eq("normalized_handle", resolved.handle)
    .maybeSingle();

  if (existing && existing.status === "removed") {
    return NextResponse.json({ error: "This profile was removed from the board." }, { status: 410 });
  }

  if (existing && existing.status === "disabled") {
    return NextResponse.json({ error: "This profile is currently disabled." }, { status: 403 });
  }

  if (existing) {
    const entry = Array.isArray(existing.leaderboard_entries)
      ? existing.leaderboard_entries[0]
      : existing.leaderboard_entries;
    return NextResponse.json({
      existing: true,
      creator: existing,
      rank: entry?.current_rank ?? null,
      totalBidCents: entry?.total_bid_cents ?? 0,
      clickCount: entry?.click_count ?? 0,
      profile: {
        platform: resolved.platform.id,
        handle: resolved.handle,
        displayHandle: resolved.displayHandle,
        profileUrl: existing.profile_url,
        displayName: existing.display_name,
        bio: existing.bio,
        avatarUrl: existing.avatar_url,
        imported: true,
        partial: false,
      },
    });
  }

  const profile = await lookupPublicProfile(resolved.platform.id, resolved.handle, resolved.profileUrl);
  const baseSlug = slugify(resolved.handle) || `${resolved.platform.id}-creator`;
  const { data: slugOwner } = await admin.from("creators").select("id").eq("slug", baseSlug).maybeSingle();
  const slug = slugOwner ? `${baseSlug}-${resolved.platform.id}` : baseSlug;

  return NextResponse.json({
    existing: false,
    slug,
    profile: {
      ...profile,
      displayHandle: resolved.displayHandle,
      displayName: profile.displayName || resolved.displayHandle.replace(/^@/, ""),
    },
    fallbackMessage: profile.imported
      ? profile.partial
        ? "We found the profile, but couldn't automatically import everything."
        : null
      : "We found the profile, but couldn't automatically import everything.",
  });
}
