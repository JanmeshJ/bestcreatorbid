"use client";

import { useEffect } from "react";

export function PresencePing() {
  useEffect(() => {
    const ping = () => {
      void fetch("/api/presence", { method: "POST" });
    };
    ping();
    const id = window.setInterval(ping, 60_000);
    return () => window.clearInterval(id);
  }, []);
  return null;
}
