import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sha256Utf8 } from "@/lib/crypto/sha256";

export const runtime = "nodejs";

export type CommentRowPublic = {
  id: string;
  admission_id: number;
  nickname: string;
  content: string;
  created_at: string;
};

function clientIp(request: NextRequest): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  const xr = request.headers.get("x-real-ip");
  if (xr) return xr.trim();
  return "unknown";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const admissionId = parseInt(idStr, 10);
  if (Number.isNaN(admissionId)) {
    return NextResponse.json([], { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id, admission_id, nickname, content, created_at")
    .eq("admission_id", admissionId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[comments GET]", error);
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json((data ?? []) as CommentRowPublic[]);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const admission_id = parseInt(idStr, 10);
  if (Number.isNaN(admission_id)) {
    return NextResponse.json(
      { error: "유효하지 않은 게시글입니다." },
      { status: 400 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON 오류" }, { status: 400 });
  }

  const nickname = String(body.nickname ?? "").trim() || "익명";
  const password = String(body.password ?? "").trim();
  const content = String(body.content ?? "").trim();

  if (!password) {
    return NextResponse.json(
      { error: "비밀번호를 입력해주세요. (댓글 삭제 시 필요합니다)" },
      { status: 400 }
    );
  }
  if (content.length < 2 || content.length > 500) {
    return NextResponse.json(
      { error: "댓글은 2자 이상 500자 이내로 작성해주세요." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: adm } = await supabase
    .from("admissions")
    .select("id")
    .eq("id", admission_id)
    .eq("published", true)
    .maybeSingle();

  if (!adm) {
    return NextResponse.json({ error: "게시글을 찾을 수 없습니다." }, { status: 404 });
  }

  const ip = clientIp(request);
  const ip_hash = sha256Utf8(ip);
  const password_hash = sha256Utf8(password);

  const insertRow = {
    admission_id,
    nickname,
    password_hash,
    content,
    ip_hash,
    is_deleted: false,
  };

  const { data, error } = await supabase
    .from("comments")
    .insert(insertRow)
    .select("id, admission_id, nickname, content, created_at")
    .single();

  if (error) {
    console.error("[comments POST]", error);
    return NextResponse.json(
      { error: "댓글 등록에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json(data as CommentRowPublic);
}
