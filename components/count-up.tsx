"use client";

import { useCountUp } from "@/lib/use-count-up";

export function CountUp({ value, className }: { value: number; className?: string }) {
  const { ref, value: animated } = useCountUp<HTMLSpanElement>(value);
  return (
    <span ref={ref} className={className}>
      {animated.toLocaleString("en-US")}
    </span>
  );
}
