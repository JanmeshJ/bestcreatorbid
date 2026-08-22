import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object;
      const paymentIntent =
        typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null;

      if (session.payment_status !== "paid" && event.type === "checkout.session.completed") {
        return NextResponse.json({ received: true, ignored: "unpaid" });
      }

      const bidId = session.metadata?.bid_id;
      if (bidId) {
        await admin
          .from("bids")
          .update({ stripe_checkout_session_id: session.id })
          .eq("id", bidId)
          .is("stripe_checkout_session_id", null);
      }

      const { data, error } = await admin.rpc("apply_successful_checkout", {
        p_stripe_event_id: event.id,
        p_event_type: event.type,
        p_checkout_session_id: session.id,
        p_payment_intent_id: paymentIntent,
        // never credit more rank than Stripe actually collected
        p_amount_total_cents: session.amount_total,
      });

      if (error) {
        console.error("apply_successful_checkout failed", error);
        return NextResponse.json({ error: "Failed to apply payment." }, { status: 500 });
      }

      if (data && typeof data === "object" && "amount_mismatch" in data) {
        // The event is consumed on purpose so Stripe stops retrying, but the
        // bid is parked as failed and needs a human to look at it.
        console.error("stripe amount mismatch, bid not applied", { eventId: event.id, result: data });
      }

      return NextResponse.json({ received: true, result: data });
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      await admin
        .from("bids")
        .update({ status: "expired" })
        .eq("stripe_checkout_session_id", session.id)
        .eq("status", "pending");
      await admin.from("stripe_events").upsert({ stripe_event_id: event.id, event_type: event.type });
      return NextResponse.json({ received: true });
    }

    if (event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object;
      await admin
        .from("bids")
        .update({ status: "failed" })
        .eq("stripe_checkout_session_id", session.id)
        .eq("status", "pending");
      await admin.from("stripe_events").upsert({ stripe_event_id: event.id, event_type: event.type });
      return NextResponse.json({ received: true });
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object;
      const paymentIntent = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
      if (paymentIntent) {
        const { error } = await admin.rpc("reverse_refunded_bid", {
          p_stripe_event_id: event.id,
          p_event_type: event.type,
          p_payment_intent_id: paymentIntent,
          // cumulative refunded total, so the RPC can claw back only the delta.
          // charge.refunded also fires for partial refunds.
          p_amount_refunded_cents: charge.amount_refunded,
        });
        if (error) {
          console.error("reverse_refunded_bid failed", error);
          return NextResponse.json({ error: "Failed to reverse refund." }, { status: 500 });
        }
      }
      return NextResponse.json({ received: true });
    }

    if (event.type === "charge.dispute.created") {
      const dispute = event.data.object;
      const paymentIntent =
        typeof dispute.payment_intent === "string" ? dispute.payment_intent : dispute.payment_intent?.id || null;
      if (paymentIntent) {
        const { error } = await admin.rpc("handle_disputed_charge", {
          p_stripe_event_id: event.id,
          p_event_type: event.type,
          p_payment_intent_id: paymentIntent,
        });
        if (error) {
          console.error("handle_disputed_charge failed", error);
          return NextResponse.json({ error: "Failed to apply dispute." }, { status: 500 });
        }
      }
      return NextResponse.json({ received: true });
    }

    await admin.from("stripe_events").upsert({ stripe_event_id: event.id, event_type: event.type });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("webhook error", error);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}
