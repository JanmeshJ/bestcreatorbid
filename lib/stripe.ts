import Stripe from "stripe";
import "server-only";

let stripe: Stripe | null = null;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      // Pin explicitly: without this the account's dashboard default is used,
      // which can change underneath the app and silently alter payloads.
      apiVersion: "2026-07-29.dahlia",
    });
  }
  return stripe;
}
