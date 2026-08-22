import { siteUrl } from "@/lib/utils";

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
