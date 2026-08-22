import type { ProfileProvider } from "./types";

export const GenericProvider: ProfileProvider = {
  platform: "other",
  async lookup() {
    return null;
  },
};
