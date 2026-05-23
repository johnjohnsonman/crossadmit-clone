import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import {
  extractFromStudyKoreaPost,
  loadStudyKoreaPost,
} from "@/lib/admissions/load-post-extract";
import { createAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: postId } = await params;
  const supabase = createAdminClient();
  const post = await loadStudyKoreaPost(supabase, postId);

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  try {
    const extracted = await extractFromStudyKoreaPost(supabase, post);
    return NextResponse.json({
      extracted,
      post: {
        id: post.id,
        title: post.title,
        url: post.url,
        content_preview: (post.content ?? "").slice(0, 500),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
