export const PLATFORM_IDS = [
  "youtube",
  "instagram",
  "tiktok",
  "x",
  "facebook",
  "twitch",
  "linkedin",
  "threads",
  "snapchat",
  "kick",
  "patreon",
  "substack",
  "pinterest",
  "reddit",
  "other",
] as const;

export type PlatformId = (typeof PLATFORM_IDS)[number];

export type PlatformConfig = {
  id: PlatformId;
  name: string;
  shortName: string;
  domains: string[];
  icon: PlatformId;
  placeholder: string;
  example: string;
  accent: string;
  enabled: boolean;
  showInFilters: boolean;
  urlPath: string;
  handlePrefix: string;
  normalizeHandle: (input: string) => string | null;
  buildProfileUrl: (handle: string) => string;
  validateHandle: (handle: string) => boolean;
};

function stripProtocol(value: string) {
  return value.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "");
}

function extractHandleFromUrl(input: string, domains: string[], prefixes: string[] = []) {
  try {
    const withProto = input.match(/^https?:\/\//i) ? input : `https://${input}`;
    const url = new URL(withProto);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (!domains.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
      return null;
    }
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length === 0) {
      const sub = host.split(".")[0];
      if (sub && !domains.includes(host)) return sub.toLowerCase();
      return null;
    }
    if (prefixes.includes(parts[0].toLowerCase()) && parts[1]) {
      return decodeURIComponent(parts[1]).replace(/^@/, "").toLowerCase();
    }
    return decodeURIComponent(parts[0]).replace(/^@/, "").toLowerCase();
  } catch {
    return null;
  }
}

function asHandle(input: string) {
  return input.trim().replace(/^@/, "").replace(/^\/+/, "").split(/[/?#]/)[0]?.toLowerCase() ?? "";
}

function looksLikeUrl(trimmed: string, domains: string[]) {
  if (/^https?:\/\//i.test(trimmed)) return true;
  // A "/" only ever shows up here as a path separator (a bare handle can't
  // contain one), so it's a reliable url-vs-handle signal. A "." alone is
  // not: plenty of real handles contain one (Instagram/TikTok/YouTube all
  // allow periods, e.g. "khaby.lame"), and "handle.with.dots" parses as a
  // syntactically valid bare hostname, so a naive "contains a dot -> URL"
  // check misroutes a real handle into URL parsing and rejects it outright.
  if (trimmed.includes("/")) return true;
  const bare = trimmed.replace(/^www\./i, "").toLowerCase();
  return domains.some((domain) => bare === domain || bare.startsWith(`${domain}/`));
}

function standardHandle(input: string, domains: string[], prefixes: string[] = []) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (looksLikeUrl(trimmed, domains)) {
    return extractHandleFromUrl(trimmed, domains, prefixes);
  }
  const handle = asHandle(trimmed);
  return handle || null;
}

const HANDLE_RE = /^[a-z0-9._-]{2,64}$/i;
const X_HANDLE_RE = /^[a-z0-9_]{1,15}$/i;
const YT_HANDLE_RE = /^[a-zA-Z0-9._-]{3,30}$/;

export const PLATFORMS: Record<PlatformId, PlatformConfig> = {
  youtube: {
    id: "youtube",
    name: "YouTube",
    shortName: "YouTube",
    domains: ["youtube.com", "m.youtube.com", "youtu.be"],
    icon: "youtube",
    placeholder: "@mrbeast",
    example: "@mrbeast",
    accent: "#FF0000",
    enabled: true,
    showInFilters: true,
    urlPath: "youtube",
    handlePrefix: "@",
    normalizeHandle: (input) => {
      const trimmed = input.trim();
      try {
        const withProto = trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`;
        const url = new URL(withProto);
        const host = url.hostname.replace(/^www\./i, "").toLowerCase();
        if (["youtube.com", "m.youtube.com"].includes(host)) {
          const parts = url.pathname.split("/").filter(Boolean);
          if (parts[0]?.startsWith("@")) return parts[0].slice(1).toLowerCase();
          if (["c", "user", "channel"].includes(parts[0]?.toLowerCase()) && parts[1]) {
            return decodeURIComponent(parts[1]).replace(/^@/, "").toLowerCase();
          }
        }
      } catch {
        /* fall through */
      }
      return standardHandle(input, ["youtube.com", "m.youtube.com"], ["c", "user", "channel", "@"]);
    },
    buildProfileUrl: (handle) =>
      handle.startsWith("UC") && handle.length >= 20
        ? `https://www.youtube.com/channel/${handle}`
        : `https://www.youtube.com/@${handle}`,
    validateHandle: (handle) => YT_HANDLE_RE.test(handle) || /^UC[\w-]{20,}$/.test(handle),
  },
  instagram: {
    id: "instagram",
    name: "Instagram",
    shortName: "Instagram",
    domains: ["instagram.com", "instagr.am"],
    icon: "instagram",
    placeholder: "@cristiano",
    example: "@cristiano",
    accent: "#E1306C",
    enabled: true,
    showInFilters: true,
    urlPath: "instagram",
    handlePrefix: "@",
    normalizeHandle: (input) => standardHandle(input, ["instagram.com", "instagr.am"]),
    buildProfileUrl: (handle) => `https://www.instagram.com/${handle}/`,
    validateHandle: (handle) => /^[a-z0-9._]{1,30}$/i.test(handle),
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    shortName: "TikTok",
    domains: ["tiktok.com", "vm.tiktok.com"],
    icon: "tiktok",
    placeholder: "@khaby.lame",
    example: "@khaby.lame",
    accent: "#111111",
    enabled: true,
    showInFilters: true,
    urlPath: "tiktok",
    handlePrefix: "@",
    normalizeHandle: (input) => standardHandle(input, ["tiktok.com", "vm.tiktok.com"]),
    buildProfileUrl: (handle) => `https://www.tiktok.com/@${handle}`,
    validateHandle: (handle) => /^[a-z0-9._]{2,24}$/i.test(handle),
  },
  x: {
    id: "x",
    name: "X / Twitter",
    shortName: "X",
    domains: ["x.com", "twitter.com", "mobile.twitter.com"],
    icon: "x",
    placeholder: "@elonmusk",
    example: "@elonmusk",
    accent: "#111111",
    enabled: true,
    showInFilters: true,
    urlPath: "x",
    handlePrefix: "@",
    normalizeHandle: (input) =>
      standardHandle(input, ["x.com", "twitter.com", "mobile.twitter.com"]),
    buildProfileUrl: (handle) => `https://x.com/${handle}`,
    validateHandle: (handle) => X_HANDLE_RE.test(handle),
  },
  facebook: {
    id: "facebook",
    name: "Facebook",
    shortName: "Facebook",
    domains: ["facebook.com", "fb.com", "m.facebook.com"],
    icon: "facebook",
    placeholder: "facebook.com/username",
    example: "facebook.com/zuck",
    accent: "#1877F2",
    enabled: true,
    showInFilters: false,
    urlPath: "facebook",
    handlePrefix: "",
    normalizeHandle: (input) =>
      standardHandle(input, ["facebook.com", "fb.com", "m.facebook.com"], ["profile.php"]),
    buildProfileUrl: (handle) => `https://www.facebook.com/${handle}`,
    validateHandle: (handle) => HANDLE_RE.test(handle),
  },
  twitch: {
    id: "twitch",
    name: "Twitch",
    shortName: "Twitch",
    domains: ["twitch.tv", "m.twitch.tv"],
    icon: "twitch",
    placeholder: "twitch.tv/username",
    example: "twitch.tv/pokimane",
    accent: "#9146FF",
    enabled: true,
    showInFilters: true,
    urlPath: "twitch",
    handlePrefix: "",
    normalizeHandle: (input) => standardHandle(input, ["twitch.tv", "m.twitch.tv"]),
    buildProfileUrl: (handle) => `https://www.twitch.tv/${handle}`,
    validateHandle: (handle) => /^[a-z0-9_]{4,25}$/i.test(handle),
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    shortName: "LinkedIn",
    domains: ["linkedin.com"],
    icon: "linkedin",
    placeholder: "linkedin.com/in/...",
    example: "linkedin.com/in/janedoe",
    accent: "#0A66C2",
    enabled: true,
    showInFilters: true,
    urlPath: "linkedin",
    handlePrefix: "",
    normalizeHandle: (input) => {
      const trimmed = input.trim();
      if (/[\.\/]/.test(trimmed) || /^https?:/i.test(trimmed)) {
        try {
          const url = new URL(trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`);
          const parts = url.pathname.split("/").filter(Boolean);
          if (parts[0] === "in" && parts[1]) return decodeURIComponent(parts[1]).toLowerCase();
          if (parts[0] === "company" && parts[1]) return `company:${decodeURIComponent(parts[1]).toLowerCase()}`;
        } catch {
          return null;
        }
      }
      return asHandle(trimmed) || null;
    },
    buildProfileUrl: (handle) =>
      handle.startsWith("company:")
        ? `https://www.linkedin.com/company/${handle.slice(8)}/`
        : `https://www.linkedin.com/in/${handle}/`,
    validateHandle: (handle) => /^[a-z0-9._%-]{3,100}$/i.test(handle.replace(/^company:/, "")),
  },
  threads: {
    id: "threads",
    name: "Threads",
    shortName: "Threads",
    domains: ["threads.net", "threads.com"],
    icon: "threads",
    placeholder: "@handle",
    example: "@mosseri",
    accent: "#111111",
    enabled: true,
    showInFilters: false,
    urlPath: "threads",
    handlePrefix: "@",
    normalizeHandle: (input) => standardHandle(input, ["threads.net", "threads.com"]),
    buildProfileUrl: (handle) => `https://www.threads.net/@${handle}`,
    validateHandle: (handle) => /^[a-z0-9._]{1,30}$/i.test(handle),
  },
  snapchat: {
    id: "snapchat",
    name: "Snapchat",
    shortName: "Snapchat",
    domains: ["snapchat.com"],
    icon: "snapchat",
    placeholder: "snapchat.com/add/username",
    example: "snapchat.com/add/username",
    accent: "#FFFC00",
    enabled: true,
    showInFilters: false,
    urlPath: "snapchat",
    handlePrefix: "",
    normalizeHandle: (input) => standardHandle(input, ["snapchat.com"], ["add"]),
    buildProfileUrl: (handle) => `https://www.snapchat.com/add/${handle}`,
    validateHandle: (handle) => /^[a-z0-9._-]{3,15}$/i.test(handle),
  },
  kick: {
    id: "kick",
    name: "Kick",
    shortName: "Kick",
    domains: ["kick.com"],
    icon: "kick",
    placeholder: "kick.com/username",
    example: "kick.com/username",
    accent: "#53FC18",
    enabled: true,
    showInFilters: false,
    urlPath: "kick",
    handlePrefix: "",
    normalizeHandle: (input) => standardHandle(input, ["kick.com"]),
    buildProfileUrl: (handle) => `https://kick.com/${handle}`,
    validateHandle: (handle) => /^[a-z0-9_]{3,25}$/i.test(handle),
  },
  patreon: {
    id: "patreon",
    name: "Patreon",
    shortName: "Patreon",
    domains: ["patreon.com"],
    icon: "patreon",
    placeholder: "patreon.com/username",
    example: "patreon.com/username",
    accent: "#FF424D",
    enabled: true,
    showInFilters: false,
    urlPath: "patreon",
    handlePrefix: "",
    normalizeHandle: (input) => standardHandle(input, ["patreon.com"], ["c"]),
    buildProfileUrl: (handle) => `https://www.patreon.com/${handle}`,
    validateHandle: (handle) => HANDLE_RE.test(handle),
  },
  substack: {
    id: "substack",
    name: "Substack",
    shortName: "Substack",
    domains: ["substack.com"],
    icon: "substack",
    placeholder: "username.substack.com",
    example: "example.substack.com",
    accent: "#FF6719",
    enabled: true,
    showInFilters: false,
    urlPath: "substack",
    handlePrefix: "",
    normalizeHandle: (input) => {
      const trimmed = input.trim();
      try {
        const url = new URL(trimmed.match(/^https?:\/\//i) ? trimmed : `https://${trimmed}`);
        const host = url.hostname.replace(/^www\./i, "").toLowerCase();
        if (host.endsWith(".substack.com")) return host.replace(".substack.com", "");
        if (host === "substack.com") {
          const parts = url.pathname.split("/").filter(Boolean);
          if (parts[0]) return parts[0].replace(/^@/, "").toLowerCase();
        }
      } catch {
        /* fall through */
      }
      return asHandle(trimmed).replace(/\.substack\.com$/i, "") || null;
    },
    buildProfileUrl: (handle) => `https://${handle}.substack.com`,
    validateHandle: (handle) => /^[a-z0-9-]{2,63}$/i.test(handle),
  },
  pinterest: {
    id: "pinterest",
    name: "Pinterest",
    shortName: "Pinterest",
    domains: ["pinterest.com"],
    icon: "pinterest",
    placeholder: "pinterest.com/username",
    example: "pinterest.com/username",
    accent: "#E60023",
    enabled: true,
    showInFilters: false,
    urlPath: "pinterest",
    handlePrefix: "",
    normalizeHandle: (input) => standardHandle(input, ["pinterest.com"]),
    buildProfileUrl: (handle) => `https://www.pinterest.com/${handle}/`,
    validateHandle: (handle) => HANDLE_RE.test(handle),
  },
  reddit: {
    id: "reddit",
    name: "Reddit",
    shortName: "Reddit",
    domains: ["reddit.com", "old.reddit.com"],
    icon: "reddit",
    placeholder: "u/username",
    example: "u/spez",
    accent: "#FF4500",
    enabled: true,
    showInFilters: false,
    urlPath: "reddit",
    handlePrefix: "u/",
    normalizeHandle: (input) => {
      const trimmed = input.trim().replace(/^u\//i, "").replace(/^\/u\//i, "");
      return standardHandle(trimmed, ["reddit.com", "old.reddit.com"], ["user", "u"]);
    },
    buildProfileUrl: (handle) => `https://www.reddit.com/user/${handle}/`,
    validateHandle: (handle) => /^[a-z0-9_-]{3,20}$/i.test(handle),
  },
  other: {
    id: "other",
    name: "Other",
    shortName: "Other",
    domains: [],
    icon: "other",
    placeholder: "https://your-site.com",
    example: "https://your-site.com",
    accent: "#FF5A1F",
    enabled: true,
    showInFilters: true,
    urlPath: "other",
    handlePrefix: "",
    normalizeHandle: (input) => {
      try {
        const url = new URL(input.match(/^https?:\/\//i) ? input : `https://${input}`);
        const host = url.hostname.replace(/^www\./i, "").toLowerCase();
        const path = url.pathname.replace(/\/$/, "");
        return `${host}${path}`.toLowerCase().slice(0, 80);
      } catch {
        const handle = asHandle(input);
        return handle || null;
      }
    },
    buildProfileUrl: (handle) => {
      if (handle.includes("/")) return `https://${handle}`;
      if (handle.includes(".")) return `https://${handle}`;
      return `https://${handle}`;
    },
    validateHandle: (handle) => handle.length >= 3 && handle.length <= 80 && !/\s/.test(handle),
  },
};

/**
 * What we show inline in the bid input so people only type the handle itself.
 * `prefix` sits before the caret, `suffix` after it (Substack uses a subdomain).
 * Purely a visual affordance: normalizeHandle still accepts a bare handle or a
 * full pasted URL, so whatever is typed is passed through untouched.
 */
export const HANDLE_AFFIX: Record<PlatformId, { prefix: string; suffix?: string }> = {
  youtube: { prefix: "youtube.com/@" },
  instagram: { prefix: "instagram.com/" },
  tiktok: { prefix: "tiktok.com/@" },
  x: { prefix: "x.com/" },
  facebook: { prefix: "facebook.com/" },
  twitch: { prefix: "twitch.tv/" },
  linkedin: { prefix: "linkedin.com/in/" },
  threads: { prefix: "threads.net/@" },
  snapchat: { prefix: "snapchat.com/add/" },
  kick: { prefix: "kick.com/" },
  patreon: { prefix: "patreon.com/" },
  substack: { prefix: "", suffix: ".substack.com" },
  pinterest: { prefix: "pinterest.com/" },
  reddit: { prefix: "reddit.com/user/" },
  other: { prefix: "" },
};

export const ENABLED_PLATFORMS = PLATFORM_IDS.map((id) => PLATFORMS[id]).filter((p) => p.enabled);

export const FILTER_PLATFORMS = ENABLED_PLATFORMS.filter((p) => p.showInFilters);

export function isPlatformId(value: string): value is PlatformId {
  return PLATFORM_IDS.includes(value as PlatformId);
}

export function getPlatform(id: string) {
  if (!isPlatformId(id)) return null;
  const platform = PLATFORMS[id];
  return platform.enabled ? platform : null;
}

export function detectPlatformFromUrl(input: string): PlatformId | null {
  const host = stripProtocol(input).split("/")[0]?.toLowerCase();
  if (!host) return null;
  for (const platform of ENABLED_PLATFORMS) {
    if (platform.domains.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
      return platform.id;
    }
  }
  return null;
}

export function resolveCreatorInput(platformId: PlatformId, input: string) {
  const platform = getPlatform(platformId);
  if (!platform) return { ok: false as const, error: "That platform is not supported yet." };
  const normalized = platform.normalizeHandle(input);
  if (!normalized || !platform.validateHandle(normalized)) {
    return {
      ok: false as const,
      error: `Enter a valid ${platform.name} handle or profile URL.`,
    };
  }
  return {
    ok: true as const,
    platform,
    handle: normalized,
    displayHandle: `${platform.handlePrefix}${normalized.replace(/^company:/, "")}`,
    profileUrl: platform.buildProfileUrl(normalized),
  };
}

export function displayHandle(platformId: PlatformId, handle: string) {
  const platform = PLATFORMS[platformId];
  const clean = handle.replace(/^company:/, "");
  return `${platform?.handlePrefix ?? ""}${clean}`;
}
