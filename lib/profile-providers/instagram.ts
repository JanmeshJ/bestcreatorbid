import type { ProfileProvider } from "./types";

export const InstagramProvider: ProfileProvider = {
  platform: "instagram",
  async lookup() {
    return null;
  },
};
