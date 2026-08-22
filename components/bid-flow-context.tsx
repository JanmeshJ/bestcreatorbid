"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type TakeSpotIntent = {
  amountDollars: number;
  handle?: string;
  rank?: number;
};

type BidFlowContextValue = {
  intent: TakeSpotIntent | null;
  bump: number;
  prepareTakeSpot: (intent: TakeSpotIntent) => void;
};

const BidFlowContext = createContext<BidFlowContextValue | null>(null);

export function BidFlowProvider({ children }: { children: React.ReactNode }) {
  const [intent, setIntent] = useState<TakeSpotIntent | null>(null);
  const [bump, setBump] = useState(0);
  const prepareTakeSpot = useCallback((next: TakeSpotIntent) => {
    setIntent(next);
    setBump((value) => value + 1);
    document.getElementById("bid")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);
  const value = useMemo(() => ({ intent, bump, prepareTakeSpot }), [intent, bump, prepareTakeSpot]);
  return <BidFlowContext.Provider value={value}>{children}</BidFlowContext.Provider>;
}

export function useBidFlow() {
  const ctx = useContext(BidFlowContext);
  if (!ctx) throw new Error("useBidFlow must be used within BidFlowProvider");
  return ctx;
}
