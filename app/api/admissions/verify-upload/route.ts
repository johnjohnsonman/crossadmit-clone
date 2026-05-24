import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = "admission-proofs";
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File must be under 5MB" },
        { status: 400 }
      );
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { error: "JPEG, PNG, WebP, or PDF only" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const safeExt = ["jpg", "jpeg", "png", "webp", "pdf"].includes(ext)
      ? ext
      : "bin";
    const path = `intl/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
    const buf = Buffer.from(await file.arrayBuffer());

    const admin = createAdminClient();
    const { error: upErr } = await admin.storage
      .from(BUCKET)
      .upload(path, buf, {
        contentType: file.type,
        upsert: false,
      });

    if (upErr) {
      console.error("[verify-upload]", upErr);
      return NextResponse.json(
        {
          error:
            "Upload failed. Storage bucket may not be configured yet — you can submit without verification.",
        },
        { status: 500 }
      );
    }

    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ success: true, url: pub.publicUrl, path });
  } catch (e) {
    console.error("[verify-upload]", e);
    return NextResponse.json({ error: "Upload error" }, { status: 500 });
  }
}
