import type { ProfileProvider } from "./types";

async function youtubeApi(handle: string) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  const forHandle = handle.startsWith("@") ? handle : `@${handle}`;
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("key", key);
  if (handle.startsWith("UC") && handle.length >= 20) {
    url.searchParams.set("id", handle);
  } else {
    url.searchParams.set("forHandle", forHandle);
  }
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    items?: Array<{
      snippet?: { title?: string; description?: string; thumbnails?: { high?: { url?: string }; default?: { url?: string } } };
    }>;
  };
  const snippet = json.items?.[0]?.snippet;
  if (!snippet?.title) return null;
  return {
    displayName: snippet.title,
    bio: snippet.description?.slice(0, 180) ?? null,
    avatarUrl: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || null,
  };
}

async function youtubeOEmbed(profileUrl: string) {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(profileUrl)}&format=json`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const json = (await res.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
  if (!json.author_name && !json.title) return null;
  return {
    displayName: json.author_name || json.title || null,
    bio: null,
    avatarUrl: json.thumbnail_url || null,
  };
}

export const YouTubeProvider: ProfileProvider = {
  platform: "youtube",
  async lookup(handle, profileUrl) {
    return (await youtubeApi(handle)) || (await youtubeOEmbed(profileUrl));
  },
};
