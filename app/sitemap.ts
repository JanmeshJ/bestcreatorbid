import { ENABLED_PLATFORMS } from "@/lib/platforms";
import { siteUrl } from "@/lib/utils";

export default function sitemap() {
  const base = siteUrl();
  const staticRoutes = ["", "/wall", "/rules", "/privacy", "/terms", "/cookies", "/removal", "/stats"].map(
    (path) => ({
      url: `${base}${path || "/"}`,
      lastModified: new Date(),
    })
  );
  const platforms = ENABLED_PLATFORMS.map((platform) => ({
    url: `${base}/${platform.urlPath}`,
    lastModified: new Date(),
  }));
  return [...staticRoutes, ...platforms];
}
