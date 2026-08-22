import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiErrorHandling } from "@/lib/api-error";
import { PAYMENT_NOTICE, MIN_BID_CENTS, MAX_BID_CENTS } from "@/lib/constants";
import { amountToTakeFirst } from "@/lib/money";
import { getPlatform, isPlatformId, resolveCreatorInput } from "@/lib/platforms";
import { hashValue, hitRateLimit } from "@/lib/rate-limit";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl, slugify } from "@/lib/utils";

const Body = z.object({
  platform: z.string(),
  handle: z.string().min(1).max(80),
  displayName: z.string().min(1).max(80),
  bio: z.string().max(180).optional().nullable(),
          avatarUrl: z.string().optional().nullable(),
  profileUrl: z.string().url(),
  amountDollars: z.number().int().positive(),
  supporterName: z.string().max(80).optional().nullable(),
  supporterPublic: z.boolean().optional(),
  existingCreatorId: z.string().uuid().optional().nullable(),
});

function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export const POST = withApiErrorHandling(async (req: Request) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = await hitRateLimit(`checkout:${hashValue(ip)}`, 12, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many checkout attempts. Try again later." }, { status: 429 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the bid details and try again." }, { status: 400 });
  }

  const body = parsed.data;
  if (!isPlatformId(body.platform) || !getPlatform(body.platform)) {
    return NextResponse.json({ error: "Unsupported platform." }, { status: 400 });
  }

  const resolved = resolveCreatorInput(body.platform, body.handle);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  if (!isSafeHttpUrl(body.profileUrl)) {
    return NextResponse.json({ error: "Profile URL looks invalid." }, { status: 400 });
  }

  if (body.avatarUrl && !isSafeHttpUrl(body.avatarUrl)) {
    return NextResponse.json({ error: "Avatar URL looks invalid." }, { status: 400 });
  }

  const amountCents = body.amountDollars * 100;
  if (amountCents < MIN_BID_CENTS || amountCents > MAX_BID_CENTS) {
    return NextResponse.json({ error: `Bids must be whole dollars between $${MIN_BID_CENTS / 100} and $${MAX_BID_CENTS / 100}.` }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("creators")
    .select("id, slug, display_name, handle, platform, status, profile_url")
    .eq("platform", resolved.platform.id)
    .eq("normalized_handle", resolved.handle)
    .maybeSingle();

  if (existing?.status === "removed" || existing?.status === "disabled") {
    return NextResponse.json({ error: "This profile cannot receive bids right now." }, { status: 403 });
  }

  if (body.existingCreatorId && existing && body.existingCreatorId !== existing.id) {
    return NextResponse.json({ error: "Creator mismatch." }, { status: 400 });
  }

  const { data: leader } = await admin
    .from("leaderboard_entries")
    .select("total_bid_cents")
    .order("total_bid_cents", { ascending: false })
    .limit(1)
    .maybeSingle();

  const baseSlug = slugify(resolved.handle) || `${resolved.platform.id}-creator`;
  const { data: slugOwner } = await admin.from("creators").select("id").eq("slug", baseSlug).maybeSingle();
  const slug = existing?.slug || (slugOwner ? `${baseSlug}-${resolved.platform.id}` : baseSlug);

  const payload = {
    platform: resolved.platform.id,
    handle: resolved.handle,
    normalized_handle: resolved.handle,
    slug,
    display_name: body.displayName.trim(),
    bio: body.bio?.trim() || null,
    avatar_url: body.avatarUrl || null,
    profile_url: existing?.profile_url || resolved.profileUrl,
  };

  const { data: bid, error: bidError } = await admin
    .from("bids")
    .insert({
      creator_id: existing?.id ?? null,
      amount_cents: amountCents,
      status: "pending",
      supporter_name: body.supporterName?.trim() || null,
      supporter_public: Boolean(body.supporterPublic),
      creator_payload: payload,
    })
    .select("id")
    .single();

  if (bidError || !bid) {
    return NextResponse.json({ error: "Could not start checkout." }, { status: 500 });
  }

  const takeFirstAt = amountToTakeFirst(leader?.total_bid_cents ?? 0);
  const takesFirst = amountCents >= takeFirstAt;

  const stripe = getStripe();
  const origin = siteUrl();
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancelled`,
      // Bidding is fully anonymous (no accounts), so Checkout collects the
      // email itself instead of us pre-filling one.
      // Companies bidding to rank need a receipt they can expense, so issue a
      // real invoice for every paid session.
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `Leaderboard ranking on bestcreatorbid.lol for ${resolved.displayHandle}. Ranking only; the listed creator is not paid.`,
          metadata: {
            bid_id: bid.id,
            platform: resolved.platform.id,
            handle: resolved.handle,
          },
        },
      },
      // Lets us compare this flow against future ones in the Dashboard.
      integration_identifier: "bid-checkout-qkzrmvtd",
      metadata: {
        bid_id: bid.id,
        platform: resolved.platform.id,
        handle: resolved.handle,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: `bestcreatorbid.lol ranking for ${resolved.displayHandle}`,
              description: takesFirst
                ? `Leaderboard bid on bestcreatorbid.lol. If this payment succeeds, ${resolved.displayHandle} takes #1. Ranking only. Creators are not paid.`
                : `Leaderboard bid on bestcreatorbid.lol for ${resolved.displayHandle}. Ranking only. Creators are not paid.`,
            },
          },
        },
      ],
      custom_text: {
        submit: { message: PAYMENT_NOTICE },
      },
    },
    {
      // Guards against this exact bid being charged twice if the Stripe call
      // is retried after a network timeout.
      idempotencyKey: `bid-session-${bid.id}`,
    }
  );

  await admin
    .from("bids")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", bid.id);

  return NextResponse.json({ url: session.url, bidId: bid.id });
});
