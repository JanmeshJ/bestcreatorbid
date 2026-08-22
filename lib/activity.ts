export function activityCopy(type: string, metadata: Record<string, unknown>) {
  const handle = metadata.handle ? `@${String(metadata.handle).replace(/^@/, "")}` : "a creator";
  const amount = typeof metadata.amount_cents === "number" ? Math.round(metadata.amount_cents / 100) : null;
  const rank = metadata.to_rank ?? metadata.rank;
  const from = metadata.from_rank;
  const clicks = metadata.clicks;

  switch (type) {
    case "TOOK_FIRST":
      return amount ? `${handle} just took #1 with $${amount}` : `${handle} just took #1`;
    case "RANK_CHANGED":
      if (typeof from === "number" && typeof rank === "number" && from > rank) {
        return `${handle} jumped ${from - rank} places`;
      }
      return `${handle} moved to #${rank}`;
    case "BID_PLACED":
      if (metadata.supporter_public && metadata.supporter_name) {
        return `${metadata.supporter_name} added $${amount} behind ${handle}`;
      }
      return amount ? `Someone added $${amount} behind ${handle}` : `${handle} got a new bid`;
    case "NEW_CREATOR":
      return `${handle} entered the leaderboard`;
    case "CLICK_MILESTONE":
      return `${handle} received ${clicks} clicks`;
    case "HELD_FIRST":
      return `${handle} has held #1`;
    default:
      return `${handle} made a move`;
  }
}

export function activityCompact(metadata: Record<string, unknown>) {
  const handle = metadata.handle ? String(metadata.handle).replace(/^@/, "") : "a creator";
  const amount = typeof metadata.amount_cents === "number" ? Math.round(metadata.amount_cents / 100) : null;
  const rank = metadata.to_rank ?? metadata.rank;
  if (typeof rank === "number" && amount != null) return `${handle} at #${rank} · $${amount}`;
  if (typeof rank === "number") return `${handle} at #${rank}`;
  if (amount != null) return `${handle} · $${amount}`;
  return handle;
}

export function activityLabel(type: string) {
  switch (type) {
    case "TOOK_FIRST":
      return "TOOK #1";
    case "RANK_CHANGED":
      return "JUMP";
    case "BID_PLACED":
      return "BID";
    case "NEW_CREATOR":
      return "NEW";
    case "CLICK_MILESTONE":
      return "CLICKS";
    case "HELD_FIRST":
      return "REIGN";
    default:
      return "LIVE";
  }
}
