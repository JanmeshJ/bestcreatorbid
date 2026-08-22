import type { ProfileProvider } from "./types";

export const XProvider: ProfileProvider = {
  platform: "x",
  async lookup() {
    return null;
  },
};
