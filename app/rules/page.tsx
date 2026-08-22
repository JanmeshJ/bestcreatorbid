import { LegalShell } from "@/components/legal-shell";
import { MAX_BID_CENTS, MIN_BID_CENTS, PAYMENT_NOTICE, TAKE_SPOT_INCREMENT_CENTS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rules" };

export default function RulesPage() {
  return (
    <LegalShell title="Rules">
      <p>
        bestcreatorbid.lol is a public leaderboard. There are no ads, no API keys, and no revenue share. You pay to
        stand above everyone else. Rank is the bid. Nothing else.
      </p>

      <h2 className="pt-6 text-2xl font-black">Read this before you pay</h2>
      <p className="font-semibold">This money does not go to creators.</p>
      <p>
        A bid buys a rank on bestcreatorbid.lol. That is it. Listed creators are not paid, sponsored, or affiliated
        with this site. You are paying to put a name higher on a public board, or to send clicks at a profile people
        are already fighting over.
      </p>
      <p>{PAYMENT_NOTICE}</p>

      <h2 className="pt-6 text-2xl font-black">How ranking works</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          New listings are whole US dollars, ${MIN_BID_CENTS / 100} minimum, $
          {(MAX_BID_CENTS / 100).toLocaleString("en-US")} maximum, $
          {TAKE_SPOT_INCREMENT_CENTS / 100} at a time. Rank is the creator&apos;s cumulative successful bid.
        </li>
        <li>
          Taking #1 costs at least $1 more than the current top total. Paying less still puts you on the board at
          whatever rank that bid can take. Equal totals stay in the order they were placed. The older listing keeps
          the higher rank.
        </li>
        <li>
          On a listing you will see the exact amount that takes that spot: $1 more than that creator&apos;s current
          total.
        </li>
        <li>
          Enter the same platform and @handle again to raise that listing. Anyone can add to a creator&apos;s total.
          Every successful payment is added on top of what is already there.
        </li>
        <li>
          Identity is platform plus normalized handle. youtube.com/@mrbeast and @mrbeast on YouTube are the same
          listing. Tracking query strings are ignored.
        </li>
      </ul>

      <h2 className="pt-6 text-2xl font-black">What you can list</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>A creator profile on a supported platform, or another public profile URL.</li>
        <li>
          Chat and invite links are not allowed. Telegram, WhatsApp, Discord, Messenger, Signal, and similar do not
          belong on the board. This is for profiles, not group chats.
        </li>
        <li>
          Links to sexual content are not allowed. If it is porn, NSFW, or an adult platform, it does not belong on
          the board.
        </li>
        <li>Query parameters are stripped from listing links. Affiliate, referral, and tracking URLs will not work.</li>
        <li>Link shortener URLs are not allowed. If you submit one, it is replaced by the URL it redirects to.</li>
      </ul>

      <h2 className="pt-6 text-2xl font-black">Platforms</h2>
      <p>
        Filter the board by YouTube, Instagram, TikTok, X, Twitch, LinkedIn, and more. A listing lives on one
        platform. The same person on two platforms is two listings.
      </p>

      <h2 className="pt-6 text-2xl font-black">After you pay</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Your listing is public. Clicks go to the profile you submitted, without query parameters.</li>
        <li>A completed Stripe payment is what claims the rank. Clicking Bid does not move the board.</li>
        <li>
          Payments purchase leaderboard ranking only. Listed creators do not receive these payments. bestcreatorbid.lol
          is not affiliated with the listed creator or their social platform.
        </li>
        <li>Abusive, illegal, or fraudulent listings can be removed. Fraudulent payments may be reversed.</li>
      </ul>

      <p className="pt-4 text-sm text-muted">
        These rules explain how the product works. They are not legal advice and do not provide legal immunity.
      </p>
    </LegalShell>
  );
}
