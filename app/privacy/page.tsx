import { LegalShell } from "@/components/legal-shell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy">
      <p>
        We collect the minimum we need to run bestcreatorbid.lol: profile details you submit, payment records from
        Stripe, click redirects, reports, and basic analytics.
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Payment card data is handled by Stripe. We never store full card numbers.</li>
        <li>Payer identity is private unless you opt in to show a supporter name.</li>
        <li>Click tracking stores hashed IP/session data for abuse prevention.</li>
        <li>If PostHog is configured, we collect product analytics such as page views.</li>
        <li>You can request removal of a listing via /removal.</li>
      </ul>
    </LegalShell>
  );
}
