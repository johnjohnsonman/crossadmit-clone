import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** 관리자: 비밀번호 없이 소프트 삭제 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("comments")
      .update({ is_deleted: true })
      .eq("id", id);

    if (error) {
      console.error("[admin comment delete]", error);
      return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin comment delete]", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
