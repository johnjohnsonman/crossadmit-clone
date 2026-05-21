import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const idRaw = body.id;
  const id =
    typeof idRaw === "number"
      ? idRaw
      : parseInt(String(idRaw ?? "").trim(), 10);
  const field = String(body.field ?? "").trim();
  const value = body.value;

  if (Number.isNaN(id) || !field) {
    return NextResponse.json({ error: "id, field 필수" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};

  if (field === "likes_count") {
    const n = typeof value === "number" ? value : parseInt(String(value), 10);
    if (Number.isNaN(n) || n < 0) {
      return NextResponse.json({ error: "likes_count 오류" }, { status: 400 });
    }
    patch.likes_count = n;
  } else if (field === "is_featured") {
    patch.is_featured = Boolean(value);
  } else if (field === "published") {
    patch.published = Boolean(value);
  } else {
    return NextResponse.json({ error: "허용되지 않은 field" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("admissions").update(patch).eq("id", id);
    if (error) {
      console.error("[admin update]", error);
      return NextResponse.json({ error: "업데이트 실패" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin update]", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
