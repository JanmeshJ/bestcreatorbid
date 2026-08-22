import type { ProfileProvider } from "./types";

export const TikTokProvider: ProfileProvider = {
  platform: "tiktok",
  async lookup(_handle, profileUrl) {
    const url = `https://www.tiktok.com/oembed?url=${encodeURIComponent(profileUrl)}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { author_name?: string; title?: string; thumbnail_url?: string };
    if (!json.author_name && !json.title) return null;
    return {
      displayName: json.author_name || json.title || null,
      bio: json.title && json.title !== json.author_name ? json.title.slice(0, 180) : null,
      avatarUrl: json.thumbnail_url || null,
    };
  },
};
