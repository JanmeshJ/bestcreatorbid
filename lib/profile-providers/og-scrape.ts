const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#39": "'",
  apos: "'",
  nbsp: " ",
};

function decodeEntities(value: string) {
  return value.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const codePoint = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

function readOgTag(html: string, property: string) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']og:${property}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*property=["']og:${property}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeEntities(match[1]).trim();
  }
  return null;
}

/**
 * Best-effort read of a page's own Open Graph tags — the same data a site
 * hands to iMessage/Slack/Discord for link previews. Works for ordinary
 * websites and for X, which both serve real og:title/og:image to a plain
 * server-side fetch. Instagram and LinkedIn deliberately serve a generic,
 * non-personalized shell to any non-browser request (verified by hand —
 * <title>Instagram</title>, zero og: tags, even for huge public accounts),
 * so this intentionally isn't wired up for those two; there's no free,
 * reliable path around that short of violating their ToS.
 */
export async function fetchOpenGraph(url: string) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": BROWSER_USER_AGENT },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const title = readOgTag(html, "title");
    const description = readOgTag(html, "description");
    const image = readOgTag(html, "image");
    if (!title && !description && !image) return null;
    return { title, description, image };
  } catch {
    return null;
  }
}
