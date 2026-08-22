import type { ProfileProvider } from "./types";

async function twitchToken() {
  const id = process.env.TWITCH_CLIENT_ID;
  const secret = process.env.TWITCH_CLIENT_SECRET;
  if (!id || !secret) return null;
  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${id}&client_secret=${secret}&grant_type=client_credentials`,
    { method: "POST" }
  );
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string };
  return json.access_token ? { token: json.access_token, clientId: id } : null;
}

export const TwitchProvider: ProfileProvider = {
  platform: "twitch",
  async lookup(handle) {
    const auth = await twitchToken();
    if (!auth) return null;
    const res = await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(handle)}`, {
      headers: {
        "Client-ID": auth.clientId,
        Authorization: `Bearer ${auth.token}`,
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: Array<{ display_name?: string; description?: string; profile_image_url?: string }>;
    };
    const user = json.data?.[0];
    if (!user) return null;
    return {
      displayName: user.display_name || null,
      bio: user.description?.slice(0, 180) || null,
      avatarUrl: user.profile_image_url || null,
    };
  },
};
