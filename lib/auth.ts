import "server-only";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/constants";
import { verifyAdminSessionToken } from "@/lib/admin-session";

/**
 * Whether the request carries a valid admin session cookie. There is no
 * broader "logged in user" concept in this app — bidding is fully anonymous,
 * and the only thing this gates is the /admin moderation panel.
 */
export async function isAdminAuthenticated() {
  const store = await cookies();
  return verifyAdminSessionToken(store.get(ADMIN_COOKIE)?.value);
}
