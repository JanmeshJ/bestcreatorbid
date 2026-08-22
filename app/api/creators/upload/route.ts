import { NextResponse } from "next/server";
import { withApiErrorHandling } from "@/lib/api-error";
import { hashValue, hitRateLimit } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 2 * 1024 * 1024;

export const POST = withApiErrorHandling(async (req: Request) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = await hitRateLimit(`upload:${hashValue(ip)}`, 10, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many uploads." }, { status: 429 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, WEBP, or GIF." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Keep the image under 2MB." }, { status: 400 });
  }

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `uploads/${crypto.randomUUID()}.${ext}`;
  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from("avatars").upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    return NextResponse.json({ error: "Could not save that image." }, { status: 500 });
  }
  const { data } = admin.storage.from("avatars").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
});
