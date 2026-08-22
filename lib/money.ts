import { MIN_BID_CENTS, TAKE_SPOT_INCREMENT_CENTS } from "@/lib/constants";

export function dollarsToCents(dollars: number) {
  return Math.round(dollars) * 100;
}

export function centsToDollars(cents: number) {
  return Math.round(cents / 100);
}

export function amountToTakeFirst(leaderCents: number) {
  if (!leaderCents) return MIN_BID_CENTS;
  return Math.max(MIN_BID_CENTS, leaderCents + TAKE_SPOT_INCREMENT_CENTS);
}

export function amountToOutrank(targetCents: number, myCents = 0) {
  const needed = Math.max(MIN_BID_CENTS, targetCents + TAKE_SPOT_INCREMENT_CENTS - myCents);
  return needed;
}

export function rankCopy(rank: number | null | undefined) {
  if (!rank) return "Unranked";
  return `#${rank}`;
}
