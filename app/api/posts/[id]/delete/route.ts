import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractIpHash } from "@/lib/posts/submit-anonymous";
import { canAuthorizePost } from "@/lib/posts/post-auth";
import { softDeleteStudyKoreaPost } from "@/lib/posts/update-anonymous";
import { normalizePostCategory } from "@/lib/forum/reddit-categories";
import {
  checkRateLimitBurst,
  logRateLimitAction,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const POST_AUTH_SELECT =
  "id,password_hash,anonymous_password_hash,is_published,category,subcategory,slug";

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const password =
      body.password != null ? String(body.password).trim() : undefined;
    const editToken =
      body.edit_token != null ? String(body.edit_token).trim() : undefined;

    const ipHash = extractIpHash(request);
    const rate = await checkRateLimitBurst(ipHash, "post_delete", 5, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          reason: `Too many attempts. Wait ${rate.retryAfter ?? 60}s.`,
        },
        { status: 429 }
      );
    }

    const supabase = createAdminClient();
    const { data: post, error } = await supabase
      .from("study_korea_posts")
      .select(POST_AUTH_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error || !post || post.is_published === false) {
      return NextResponse.json(
        { success: false, reason: "Post not found" },
        { status: 404 }
      );
    }

    const auth = canAuthorizePost(post, request, password, editToken);
    if (!auth.ok) {
      await logRateLimitAction(ipHash, "post_delete");
      return NextResponse.json(
        { success: false, reason: auth.reason },
        { status: auth.status }
      );
    }

    const del = await softDeleteStudyKoreaPost(id);
    if (!del.success) {
      return NextResponse.json(
        { success: false, reason: del.reason },
        { status: del.status }
      );
    }

    await logRateLimitAction(ipHash, "post_delete");

    const cat = normalizePostCategory(
      post.category as string,
      post.subcategory as string | null
    );
    const redirect = `/r/${cat}`;

    return NextResponse.json({ success: true, redirect });
  } catch (e) {
    console.error("[posts/delete]", e);
    return NextResponse.json(
      { success: false, reason: "Server error" },
      { status: 500 }
    );
  }
}
