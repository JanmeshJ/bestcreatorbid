import type { PlatformId } from "@/lib/platforms";

export type ProfileLookup = {
  platform: PlatformId;
  handle: string;
  profileUrl: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  imported: boolean;
  partial: boolean;
};

export interface ProfileProvider {
  platform: PlatformId;
  lookup(handle: string, profileUrl: string): Promise<Partial<ProfileLookup> | null>;
}
