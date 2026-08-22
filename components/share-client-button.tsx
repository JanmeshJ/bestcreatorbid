"use client";

import { Share2 } from "lucide-react";
import { shareCreator } from "@/lib/share";
import { Button } from "@/components/ui/button";

export function ShareClientButton({
  rank,
  handle,
  slug,
}: {
  rank: number;
  handle: string;
  slug: string;
}) {
  return (
    <Button variant="outline" type="button" onClick={() => void shareCreator({ rank, handle, slug })}>
      <Share2 className="h-4 w-4" />
      Share
    </Button>
  );
}
