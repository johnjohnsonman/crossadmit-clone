import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { moveStudyKoreaPostToForum } from "@/lib/admissions/move-post-to-forum";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 30;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;
  let category: string | undefined;
  try {
    const body = (await request.json()) as { category?: string };
    category = body.category;
  } catch {
    /* no body */
  }

  const supabase = createAdminClient();
  const result = await moveStudyKoreaPostToForum(supabase, postId, { category });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    category: result.category,
    forum_url: result.forum_url,
    slug: result.slug,
  });
}
