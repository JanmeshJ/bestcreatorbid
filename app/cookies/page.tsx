import { LegalShell } from "@/components/legal-shell";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cookies" };

export default function CookiesPage() {
  return (
    <LegalShell title="Cookies">
      <p>bestcreatorbid.lol uses cookies and similar storage for:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Authentication sessions if you log in</li>
        <li>Basic analytics when PostHog is enabled</li>
        <li>Remembering a presence ping so the “online” count is not wildly inflated</li>
      </ul>
      <p>You can block cookies in your browser. The public leaderboard still works without an account.</p>
    </LegalShell>
  );
}
