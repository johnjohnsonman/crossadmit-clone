import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sha256Utf8 } from "@/lib/crypto/sha256";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON 오류" }, { status: 400 });
  }

  const password = String(body.password ?? "").trim();
  if (!password) {
    return NextResponse.json({ error: "비밀번호를 입력해주세요." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const { data: row, error: fetchErr } = await admin
      .from("comments")
      .select("password_hash")
      .eq("id", id)
      .eq("is_deleted", false)
      .maybeSingle();

    if (fetchErr || !row) {
      return NextResponse.json({ error: "찾을 수 없습니다." }, { status: 404 });
    }

    if ((row as { password_hash: string }).password_hash !== sha256Utf8(password)) {
      return NextResponse.json({ error: "비밀번호가 일치하지 않습니다." }, { status: 403 });
    }

    const { error: upErr } = await admin
      .from("comments")
      .update({ is_deleted: true })
      .eq("id", id);

    if (upErr) {
      console.error("[comments DELETE]", upErr);
      return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[comments DELETE]", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
