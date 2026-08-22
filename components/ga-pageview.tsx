"use client";

import { sendGAEvent } from "@next/third-parties/google";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * <GoogleAnalytics> only calls gtag('config', ...) once on mount, which GA4
 * treats as a single initial page_view — it doesn't listen for client-side
 * route changes at all. Every navigation after the first would go untracked
 * without this, same issue as PostHog's default pageview capture.
 */
export function GAPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || !pathname) return;
    const search = searchParams.toString();
    sendGAEvent("event", "page_view", {
      page_path: search ? `${pathname}?${search}` : pathname,
    });
  }, [pathname, searchParams]);

  return null;
}
