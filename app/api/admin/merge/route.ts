import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiErrorHandling } from "@/lib/api-error";
import { isAdminAuthenticated } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const Body = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
});

export const POST = withApiErrorHandling(async (req: Request) => {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Pick a source and target creator." }, { status: 400 });
  }
  const admin = createAdminClient();
  const { error } = await admin.rpc("merge_creators", {
    p_source: parsed.data.sourceId,
    p_target: parsed.data.targetId,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await admin.from("admin_audit").insert({
    admin_email: "admin",
    action: "merge_creators",
    target_id: parsed.data.targetId,
    metadata: parsed.data,
  });
  return NextResponse.json({ ok: true });
});
