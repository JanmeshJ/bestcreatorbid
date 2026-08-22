"use client";

import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * PostHog's built-in `capture_pageview` only fires once, on init. The App
 * Router never does a full page reload on navigation, so every route change
 * after the first would go untracked without this — this is PostHog's own
 * documented pattern for Next.js App Router.
 */
export function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY || !pathname) return;
    let url = window.origin + pathname;
    const search = searchParams.toString();
    if (search) url += `?${search}`;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}
