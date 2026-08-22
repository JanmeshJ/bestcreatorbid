import type { ProfileProvider } from "./types";

export const LinkedInProvider: ProfileProvider = {
  platform: "linkedin",
  async lookup() {
    return null;
  },
};
