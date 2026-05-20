import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** admission_id 단위 댓글(삭제 포함 표시) */
export async function GET(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admissionId = request.nextUrl.searchParams.get("admission_id")?.trim();
  if (!admissionId) {
    return NextResponse.json({ error: "admission_id 필수" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("comments")
      .select("id, nickname, content, is_deleted, created_at")
      .eq("admission_id", admissionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[admin comments GET]", error);
      return NextResponse.json({ error: "조회 실패" }, { status: 500 });
    }

    return NextResponse.json({ comments: data ?? [] });
  } catch (e) {
    console.error("[admin comments GET]", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
