import { NextResponse } from "next/server";
import { z } from "zod";
import { checkAdminPassword, createAdminSessionToken } from "@/lib/admin-session";
import { adminConfigured } from "@/lib/config";
import { ADMIN_COOKIE } from "@/lib/constants";
import { hashValue, hitRateLimit } from "@/lib/rate-limit";

const Body = z.object({ password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  // hitRateLimit persists attempt counts in Supabase. Without it configured
  // there's nowhere to store that state, so skip rather than 500 — this
  // matches how the rest of the app degrades (see lib/config.ts).
  if (adminConfigured()) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limited = await hitRateLimit(`admin-login:${hashValue(ip)}`, 10, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the admin password." }, { status: 400 });
  }

  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Admin login is not configured." }, { status: 500 });
  }

  if (!checkAdminPassword(parsed.data.password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
