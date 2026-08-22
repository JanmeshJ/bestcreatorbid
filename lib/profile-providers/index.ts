import type { PlatformId } from "@/lib/platforms";
import { InstagramProvider } from "./instagram";
import { LinkedInProvider } from "./linkedin";
import { GenericProvider } from "./generic";
import { TikTokProvider } from "./tiktok";
import { TwitchProvider } from "./twitch";
import { XProvider } from "./x";
import { YouTubeProvider } from "./youtube";
import type { ProfileLookup, ProfileProvider } from "./types";

const providers: Record<string, ProfileProvider> = {
  youtube: YouTubeProvider,
  instagram: InstagramProvider,
  tiktok: TikTokProvider,
  x: XProvider,
  twitch: TwitchProvider,
  linkedin: LinkedInProvider,
  other: GenericProvider,
};

export async function lookupPublicProfile(
  platform: PlatformId,
  handle: string,
  profileUrl: string
): Promise<ProfileLookup> {
  const provider = providers[platform] ?? GenericProvider;
  let result: Partial<ProfileLookup> | null = null;
  try {
    result = await Promise.race([
      provider.lookup(handle, profileUrl),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
  } catch {
    result = null;
  }

  const displayName = result?.displayName?.trim() || null;
  const avatarUrl = result?.avatarUrl || null;
  const bio = result?.bio?.trim() || null;
  const imported = Boolean(displayName || avatarUrl || bio);

  return {
    platform,
    handle,
    profileUrl,
    displayName,
    bio,
    avatarUrl,
    imported,
    partial: imported && (!displayName || !avatarUrl),
  };
}
