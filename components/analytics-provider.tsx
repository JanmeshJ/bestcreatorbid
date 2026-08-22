"use client";

import posthog from "posthog-js";
import { Suspense, useEffect } from "react";
import { GAPageview } from "@/components/ga-pageview";
import { PostHogPageview } from "@/components/posthog-pageview";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      // Pageviews are captured manually in PostHogPageview instead, since this
      // flag only fires once on init and misses every client-side navigation.
      capture_pageview: false,
      persistence: "localStorage",
    });
  }, []);
  return (
    <>
      {/* useSearchParams requires a Suspense boundary in the App Router */}
      <Suspense fallback={null}>
        <PostHogPageview />
        <GAPageview />
      </Suspense>
      {children}
    </>
  );
}
