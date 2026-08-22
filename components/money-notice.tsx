import { PAYMENT_NOTICE } from "@/lib/constants";

export function MoneyNotice() {
  return (
    <section className="rounded-[28px] border border-orange-200 bg-gradient-to-br from-orange-50 to-card p-6 sm:p-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">Read this before you pay</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
        This money does not go to creators.
      </h2>
      <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/80">
        A bid buys a rank on bestcreatorbid.lol. That is it. Listed creators are not paid, sponsored, or affiliated
        with this site. You are paying to put a name higher on a public board, or to send clicks at a profile people
        are already fighting over.
      </p>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">{PAYMENT_NOTICE}</p>
    </section>
  );
}
