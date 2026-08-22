import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminAuthenticated } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const Body = z.object({
  displayName: z.string().min(1).max(80).optional(),
  bio: z.string().max(180).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  countryCode: z.string().max(2).nullable().optional(),
  verified: z.boolean().optional(),
  status: z.enum(["active", "disabled", "removed"]).optional(),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("creators")
    .update({
      display_name: parsed.data.displayName,
      bio: parsed.data.bio,
      avatar_url: parsed.data.avatarUrl,
      country_code: parsed.data.countryCode,
      verified: parsed.data.verified,
      status: parsed.data.status,
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (parsed.data.status) {
    await admin.rpc("recalculate_ranks");
  }

  await admin.from("admin_audit").insert({
    admin_email: "admin",
    action: "update_creator",
    target_id: id,
    metadata: parsed.data,
  });

  return NextResponse.json({ ok: true });
}
