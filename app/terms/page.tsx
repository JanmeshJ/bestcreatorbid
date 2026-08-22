import { LegalShell } from "@/components/legal-shell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <LegalShell title="Terms">
      <p>
        By using bestcreatorbid.lol you agree that bids are payments for ranking on this independent website. They are not
        donations, investments, or payments to listed creators.
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>You must be allowed to make the payment in your jurisdiction.</li>
        <li>You will not submit illegal, impersonating, or abusive listings.</li>
        <li>We may remove listings, reverse fraudulent payments, and recalculate ranks.</li>
        <li>The service is provided as-is. Rankings can change at any time.</li>
        <li>bestcreatorbid.lol is not affiliated with YouTube, Instagram, TikTok, X, or any other platform.</li>
      </ul>
    </LegalShell>
  );
}
