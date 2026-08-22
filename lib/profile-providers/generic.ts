import { fetchOpenGraph } from "./og-scrape";
import type { ProfileProvider } from "./types";

export const GenericProvider: ProfileProvider = {
  platform: "other",
  async lookup(_handle, profileUrl) {
    const og = await fetchOpenGraph(profileUrl);
    if (!og) return null;
    return {
      displayName: og.title || null,
      bio: og.description?.slice(0, 180) || null,
      avatarUrl: og.image || null,
    };
  },
};
