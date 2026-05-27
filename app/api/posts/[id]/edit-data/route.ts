import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyEditToken } from "@/lib/posts/edit-token";
import { verifyAdminAccess } from "@/lib/admin/verify";
import { POST_EDIT_SELECT } from "@/lib/posts/update-anonymous";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const token = request.nextUrl.searchParams.get("token")?.trim();

    if (!token && !verifyAdminAccess(request)) {
      return NextResponse.json(
        { success: false, reason: "Edit token required" },
        { status: 401 }
      );
    }

    if (token) {
      const check = verifyEditToken(token, id);
      if (!check.valid && !verifyAdminAccess(request)) {
        return NextResponse.json(
          { success: false, reason: check.reason || "Invalid token" },
          { status: 401 }
        );
      }
    }

    const supabase = createAdminClient();
    const { data: post, error } = await supabase
      .from("study_korea_posts")
      .select(POST_EDIT_SELECT)
      .eq("id", id)
      .eq("is_published", true)
      .maybeSingle();

    if (error || !post) {
      return NextResponse.json(
        { success: false, reason: "Post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        body: post.content,
        category: post.category,
        nickname: post.anonymous_nickname || post.author || "Anonymous",
        university: post.university,
        university_id: post.university_id,
        language: post.language || "en",
      },
    });
  } catch (e) {
    console.error("[posts/edit-data]", e);
    return NextResponse.json(
      { success: false, reason: "Server error" },
      { status: 500 }
    );
  }
}
