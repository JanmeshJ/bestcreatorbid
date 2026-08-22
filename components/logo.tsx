import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <Image
        src="/bestcreatorbidlogo.png"
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-lg object-cover"
        priority
      />
      {!compact && (
        <span className="font-logo truncate text-[15px] font-extrabold leading-none tracking-[-0.04em] text-foreground sm:text-[17px]">
          BestCreatorBid<span className="text-accent">.</span>lol
        </span>
      )}
    </span>
  );
}
