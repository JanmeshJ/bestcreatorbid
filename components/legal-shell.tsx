import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteStats } from "@/lib/data";

export async function LegalShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const stats = await getSiteStats();
  return (
    <>
      <SiteHeader
        onlineCount={stats.onlineCount}
        bidTodayCents={stats.bidTodayCents}
        clicksSent={stats.clicksSent}
      />
      <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10">
        <h1 className="text-[32px] font-black leading-tight tracking-tight sm:text-4xl">{title}</h1>
        <div className="panel prose-bestcreatorbid mt-8 space-y-4 p-6 text-[15px] leading-7 text-foreground/90 sm:p-8">
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
