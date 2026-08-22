import { RemovalForm } from "@/components/removal-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteStats } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Request removal" };

export default async function RemovalPage() {
  const stats = await getSiteStats();
  return (
    <>
      <SiteHeader
        onlineCount={stats.onlineCount}
        bidTodayCents={stats.bidTodayCents}
        clicksSent={stats.clicksSent}
      />
      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-accent">Moderation</p>
        <h1 className="mt-3 text-[32px] font-black leading-tight tracking-tight sm:text-4xl">Request removal</h1>
        <p className="mt-3 text-muted">
          Are you listed here and want this profile removed? Tell us who you are and why.
        </p>
        <div className="panel mt-6 p-6 sm:p-8">
          <RemovalForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
