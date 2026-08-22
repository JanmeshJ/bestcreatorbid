# bestcreatorbid.lol

A money-based public leaderboard for internet creators.

**Think you're the best creator? Prove it.**

Creators compete by bidding USD. The highest **cumulative successful bid** is ranked #1. Payments buy ranking on this site only. Listed creators are not paid unless we explicitly say otherwise.

## Local setup

1. Install Node.js 20+.
2. Clone this repo and install dependencies:

```bash
npm install
cp .env.example .env.local
```

3. Fill in `.env.local` (see below).
4. Run the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Without Supabase/Stripe keys the UI still renders, but lookup, checkout, and ranking will not work.

## Environment variables

See `.env.example`:

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (`http://localhost:3000` locally, `https://bestcreatorbid.lol` in production) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe for the browser, locked down with RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. Used for payments, ranking, uploads, admin |
| `STRIPE_SECRET_KEY` | Server-only Stripe secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional PostHog project key |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional PostHog host |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional GA4 measurement ID (`G-XXXXXXXXXX`) |
| `ADMIN_PASSWORD` | Shared password that unlocks `/admin`. Bidders never log in; this is the only login on the site. |
| `ADMIN_SESSION_SECRET` | Random string that signs the admin session cookie |
| `RATE_LIMIT_SALT` | Salt used when hashing IPs/sessions |
| `YOUTUBE_API_KEY` | Optional. Improves YouTube profile import |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | Optional. Improves Twitch profile import |

Never expose `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ADMIN_PASSWORD`, or `ADMIN_SESSION_SECRET` to the client.

**There is no site-wide login.** Bidding, the leaderboard, and every public page work with zero authentication, by design — anyone can bid without an account. `ADMIN_PASSWORD` gates exactly one thing: the `/admin` moderation panel.

## Supabase setup

1. Create a Supabase project.
2. In the SQL editor, run the migrations **in order**:
   1. `supabase/migrations/0001_init.sql`
   2. `supabase/migrations/0002_payment_hardening.sql` (partial-refund handling, amount verification, disputes)
3. Confirm Realtime is enabled for `leaderboard_entries` and `activity_events` (the migration tries to add them to `supabase_realtime`).
4. Confirm a public Storage bucket named `avatars` exists (also created by the migration).
5. **Do not** run `supabase/seed.sql` in production. It is fictional local demo data only.

There is no Supabase Auth step: `/admin` is gated by `ADMIN_PASSWORD` (a plain env var, checked server-side against a signed cookie), not by Supabase accounts or email. Supabase here is purely the database — creators, bids, activity, realtime, and storage.

Production should start empty: **Nobody's brave enough yet.**

## Stripe setup

1. Create a Stripe account and copy test keys into `.env.local`.
2. Create a webhook endpoint pointing at:

```
https://YOUR_DOMAIN/api/webhooks/stripe
```

3. Subscribe at least to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `charge.refunded`

4. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

### Local webhook testing

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Use the `whsec_...` value `stripe listen` prints as `STRIPE_WEBHOOK_SECRET`.

**Ranking is applied only in this webhook**, inside a Postgres function (`apply_successful_checkout`). Clicking **Pay** never changes the leaderboard.

## How payments become ranks

1. User picks a platform + handle and an amount.
2. Server creates a pending `bids` row and a Stripe Checkout Session.
3. User pays on Stripe.
4. Stripe sends a signed webhook.
5. The webhook verifies the signature, then calls `apply_successful_checkout`.
6. That function is idempotent on Stripe event IDs, upserts the creator, inserts the succeeded bid, increases `total_bid_cents`, recalculates ranks, and writes activity events.
7. The homepage subscribes to Supabase Realtime and refreshes without a reload.

## Vercel deployment

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Set every environment variable from `.env.example`.
4. Set `NEXT_PUBLIC_SITE_URL=https://bestcreatorbid.lol`.
5. Deploy.
6. Point the Stripe webhook at `https://bestcreatorbid.lol/api/webhooks/stripe`.

## Adding a social platform

1. Add a config object in `lib/platforms.ts` (`id`, domains, handle rules, profile URL builder, `enabled`).
2. Optionally add a metadata adapter in `lib/profile-providers/` and register it in `lib/profile-providers/index.ts`.
3. If it should appear in filters, set `showInFilters: true` (this also creates `/{id}`).

No database schema change is required. Identity is always `platform + normalized_handle`.

To hide a platform without deleting data, set `enabled: false`.

## Admin

Open `/admin` and enter `ADMIN_PASSWORD`. No account, no email — anyone who has the password can moderate. If several people need access, share the password with them; there's no per-admin identity.

Admins can inspect creators and bids, disable/remove listings, verify names, view reports/removal requests, and merge duplicate profiles.

## Analytics

Both are optional and independent — set either, both, or neither env var and the corresponding script simply doesn't load.

- **PostHog**: set `NEXT_PUBLIC_POSTHOG_KEY` (and `NEXT_PUBLIC_POSTHOG_HOST` if self-hosting). Wired in `components/analytics-provider.tsx`, which wraps the whole app in `app/layout.tsx`. Pageviews are captured manually on every route change (`components/posthog-pageview.tsx`) rather than via PostHog's default autocapture flag, which only fires once on initial load and would miss every client-side navigation in the App Router.
- **Google Analytics**: set `NEXT_PUBLIC_GA_MEASUREMENT_ID` to a GA4 measurement ID. Uses `@next/third-parties/google`'s `<GoogleAnalytics>` component in `app/layout.tsx` to load `gtag.js`. That component only fires once on mount, so `components/ga-pageview.tsx` sends a manual `page_view` event on every client-side route change, the same way PostHog does above.

## Click tracking

Leaderboard rows never link directly to social networks. Clicks go to `/go/[creatorId]`, which records a throttled click and redirects to the stored `profile_url` after validating it.

## License

Private product code for bestcreatorbid.lol.
