import type { ProfileProvider } from "./types";

export const LinkedInProvider: ProfileProvider = {
  platform: "linkedin",
  // Same situation as Instagram: LinkedIn serves no usable data (no og:
  // tags, effectively a login wall) to an unauthenticated server-side
  // fetch, and is one of the most aggressive platforms about pursuing
  // scrapers legally. No free, reliable path exists.
  async lookup() {
    return null;
  },
};
