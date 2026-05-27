import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractIpHash } from "@/lib/posts/submit-anonymous";
import { canAuthorizePost } from "@/lib/posts/post-auth";
import { updateStudyKoreaPost } from "@/lib/posts/update-anonymous";
import {
  checkRateLimitBurst,
  logRateLimitAction,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const POST_AUTH_SELECT =
  "id,password_hash,anonymous_password_hash,is_published";

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const password =
      body.password != null ? String(body.password).trim() : undefined;
    const editToken =
      body.edit_token != null ? String(body.edit_token).trim() : undefined;

    const ipHash = extractIpHash(request);
    const rate = await checkRateLimitBurst(ipHash, "post_edit", 5, 60);
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
      await logRateLimitAction(ipHash, "post_edit");
      return NextResponse.json(
        { success: false, reason: auth.reason },
        { status: auth.status }
      );
    }

    const result = await updateStudyKoreaPost(id, {
      title: body.title != null ? String(body.title) : undefined,
      body: body.body != null ? String(body.body) : undefined,
      category: body.category != null ? String(body.category) : undefined,
      nickname: body.nickname != null ? String(body.nickname) : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, reason: result.reason },
        { status: result.status }
      );
    }

    await logRateLimitAction(ipHash, "post_edit");

    return NextResponse.json({
      success: true,
      redirect: result.redirect,
      slug: result.slug,
      category: result.category,
    });
  } catch (e) {
    console.error("[posts/PATCH]", e);
    return NextResponse.json(
      { success: false, reason: "Server error" },
      { status: 500 }
    );
  }
}
