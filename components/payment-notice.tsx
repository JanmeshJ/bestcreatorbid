import { PAYMENT_NOTICE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PaymentNotice({ className }: { className?: string }) {
  return <p className={cn("text-[11px] leading-relaxed text-muted", className)}>{PAYMENT_NOTICE}</p>;
}
