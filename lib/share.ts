import { siteUrl } from "@/lib/utils";

export function shareCopy(rank: number, handle: string, origin?: string) {
  const base = origin || siteUrl();
  const path = `${base}/creator/${handle.replace(/^@/, "")}`;
  if (rank === 1) {
    return `Apparently I'm the #1 creator on the internet\nUntil someone outbids me.\n${path}`;
  }
  return `I'm currently the #${rank} best creator on the internet\n${path}`;
}

export async function shareCreator({
  rank,
  slug,
}: {
  rank: number;
  handle: string;
  slug: string;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : siteUrl();
  const url = `${origin}/creator/${slug}`;
  const text =
    rank === 1
      ? `Apparently I'm the #1 creator on the internet\nUntil someone outbids me.`
      : `I'm currently the #${rank} best creator on the internet`;
  if (navigator.share) {
    try {
      await navigator.share({ title: "bestcreatorbid.lol", text, url });
      return;
    } catch {
      /* fall through */
    }
  }
  await navigator.clipboard.writeText(`${text}\n${url}`);
}
