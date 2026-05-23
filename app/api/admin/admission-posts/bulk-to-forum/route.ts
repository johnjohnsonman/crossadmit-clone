import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { moveStudyKoreaPostToForum } from "@/lib/admissions/move-post-to-forum";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    ids?: string[];
    category?: string;
  };

  const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }

  if (ids.length > 50) {
    return NextResponse.json(
      { error: "한 번에 최대 50건까지 처리 가능합니다" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const results: Array<{
    id: string;
    success: boolean;
    category?: string;
    forum_url?: string;
    error?: string;
  }> = [];

  for (const id of ids) {
    const result = await moveStudyKoreaPostToForum(supabase, id, {
      category: body.category,
    });
    if (result.success) {
      results.push({
        id,
        success: true,
        category: result.category,
        forum_url: result.forum_url,
      });
    } else {
      results.push({ id, success: false, error: result.error });
    }
    await new Promise((r) => setTimeout(r, 150));
  }

  const ok = results.filter((r) => r.success).length;
  return NextResponse.json({
    success: true,
    processed: results.length,
    ok,
    failed: results.length - ok,
    results,
  });
}
