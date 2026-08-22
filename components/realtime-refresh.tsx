"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/config";

export function RealtimeRefresh() {
  const router = useRouter();
  useEffect(() => {
    if (!supabaseConfigured()) return;
    const supabase = createClient();
    const channel = supabase
      .channel("leaderboard-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "leaderboard_entries" }, () => {
        router.refresh();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);
  return null;
}
