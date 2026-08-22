"use client";

import { BidFlowProvider } from "@/components/bid-flow-context";
import { PresencePing } from "@/components/presence-ping";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import type { ActivityEvent } from "@/lib/supabase/types";

export function AppShell({
  children,
}: {
  children: React.ReactNode;
  activity: ActivityEvent[];
}) {
  return (
    <BidFlowProvider>
      {children}
      <RealtimeRefresh />
      <PresencePing />
    </BidFlowProvider>
  );
}
