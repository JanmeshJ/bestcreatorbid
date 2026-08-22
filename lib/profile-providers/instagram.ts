import type { ProfileProvider } from "./types";

export const InstagramProvider: ProfileProvider = {
  platform: "instagram",
  // Instagram serves a generic, non-personalized shell page to any
  // non-browser request — verified by hand against a huge public account
  // (@leomessi): <title>Instagram</title>, zero og: tags, even though the
  // response is a real 200. There's no free, reliable path around that
  // short of official Graph API access, which requires the creator's own
  // OAuth consent and doesn't work for arbitrary third-party lookups.
  async lookup() {
    return null;
  },
};
