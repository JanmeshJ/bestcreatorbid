export type CreatorStatus = "active" | "disabled" | "removed";
export type BidStatus = "pending" | "succeeded" | "failed" | "refunded" | "expired";

export type Creator = {
  id: string;
  platform: string;
  handle: string;
  normalized_handle: string;
  slug: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  profile_url: string;
  country_code: string | null;
  verified: boolean;
  status: CreatorStatus;
  created_at: string;
  updated_at: string;
};

export type LeaderboardEntry = {
  id: string;
  creator_id: string;
  total_bid_cents: number;
  click_count: number;
  current_rank: number | null;
  first_bid_at: string | null;
  last_bid_at: string | null;
  current_rank_started_at: string | null;
  time_at_rank_one_seconds: number;
  created_at: string;
  updated_at: string;
};

export type Bid = {
  id: string;
  creator_id: string | null;
  amount_cents: number;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  status: BidStatus;
  supporter_name: string | null;
  supporter_url: string | null;
  supporter_public: boolean;
  user_id: string | null;
  creator_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type ActivityEvent = {
  id: string;
  creator_id: string | null;
  type: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type LeaderboardRow = LeaderboardEntry & {
  creators: Creator;
};

export type CreatorPayload = {
  platform: string;
  handle: string;
  normalized_handle: string;
  slug: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  profile_url: string;
  country_code?: string | null;
};
