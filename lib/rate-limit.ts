import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export function hashValue(value: string) {
  const salt = process.env.RATE_LIMIT_SALT || "bestcreatorbid-dev-salt";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

export async function hitRateLimit(key: string, limit: number, windowMs: number) {
  const admin = createAdminClient();
  const { data } = await admin.from("rate_limits").select("*").eq("key", key).maybeSingle();
  const now = Date.now();
  if (!data) {
    await admin.from("rate_limits").insert({ key, window_start: new Date().toISOString(), hit_count: 1 });
    return { ok: true, remaining: limit - 1 };
  }
  const start = new Date(data.window_start).getTime();
  if (now - start > windowMs) {
    await admin
      .from("rate_limits")
      .update({ window_start: new Date().toISOString(), hit_count: 1 })
      .eq("key", key);
    return { ok: true, remaining: limit - 1 };
  }
  if (data.hit_count >= limit) {
    return { ok: false, remaining: 0 };
  }
  await admin
    .from("rate_limits")
    .update({ hit_count: data.hit_count + 1 })
    .eq("key", key);
  return { ok: true, remaining: limit - data.hit_count - 1 };
}
