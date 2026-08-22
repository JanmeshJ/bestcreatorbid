import { fetchOpenGraph } from "./og-scrape";
import type { ProfileProvider } from "./types";

export const XProvider: ProfileProvider = {
  platform: "x",
  async lookup(_handle, profileUrl) {
    const og = await fetchOpenGraph(profileUrl);
    if (!og) return null;
    // og:title is "Real Name (@handle) on X" — strip the suffix for a clean name.
    const displayName = og.title?.replace(/\s*\(@[^)]+\)\s*on X$/i, "").trim() || null;
    // og:description on X profiles is just a t.co link, not real bio text.
    return displayName || og.image ? { displayName, avatarUrl: og.image || null } : null;
  },
};
