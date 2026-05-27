import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createEditToken, EDIT_TOKEN_EXPIRES_SEC } from "@/lib/posts/edit-token";
import { extractIpHash } from "@/lib/posts/submit-anonymous";
import { canAuthorizePost } from "@/lib/posts/post-auth";
import {
  checkRateLimitBurst,
  logRateLimitAction,
} from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

const POST_AUTH_SELECT =
  "id,password_hash,anonymous_password_hash,is_published";

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const password = body.password != null ? String(body.password).trim() : undefined;

    const ipHash = extractIpHash(request);
    const rate = await checkRateLimitBurst(ipHash, "post_auth", 5, 60);
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

    if (error || !post) {
      return NextResponse.json(
        { success: false, reason: "Post not found" },
        { status: 404 }
      );
    }

    if (post.is_published === false) {
      return NextResponse.json(
        { success: false, reason: "Post not found" },
        { status: 404 }
      );
    }

    const auth = canAuthorizePost(post, request, password);
    if (!auth.ok) {
      await logRateLimitAction(ipHash, "post_auth");
      return NextResponse.json(
        { success: false, reason: auth.reason },
        { status: auth.status }
      );
    }

    await logRateLimitAction(ipHash, "post_auth");

    const edit_token = createEditToken(id);
    return NextResponse.json({
      success: true,
      edit_token,
      expires_in: EDIT_TOKEN_EXPIRES_SEC,
      via: auth.via,
    });
  } catch (e) {
    console.error("[posts/authorize]", e);
    return NextResponse.json(
      { success: false, reason: "Server error" },
      { status: 500 }
    );
  }
}
