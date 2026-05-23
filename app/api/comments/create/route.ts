import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { moderateAnonymousComment } from "@/lib/posts/moderate-anon";
import { checkRateLimit, logRateLimit } from "@/lib/rate-limit";
import { incrementPostCommentCount } from "@/lib/forum/comments";
import {
  extractIpHash,
} from "@/lib/posts/submit-anonymous";
import { hashAnonymousPassword } from "@/lib/security/hash";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const postId = String(body.post_id ?? "").trim();
    const content = String(body.content ?? "").trim();
    const password = String(body.password ?? "").trim();
    const parentId = body.parent_id ? String(body.parent_id) : null;

    if (!postId) {
      return NextResponse.json(
        { success: false, reason: "post_id required" },
        { status: 400 }
      );
    }
    if (content.length < 2) {
      return NextResponse.json(
        { success: false, reason: "Comment too short" },
        { status: 400 }
      );
    }
    if (!/^\d{4}$/.test(password)) {
      return NextResponse.json(
        { success: false, reason: "Password must be 4 digits" },
        { status: 400 }
      );
    }

    const ipHash = extractIpHash(request);
    const rate = await checkRateLimit(ipHash, "comment", 30);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          success: false,
          reason: `Wait ${rate.retryAfter ?? 30}s before commenting again.`,
        },
        { status: 429 }
      );
    }

    if (body.turnstile_token) {
      const ok = await verifyTurnstile(String(body.turnstile_token));
      if (!ok) {
        return NextResponse.json(
          { success: false, reason: "Captcha failed" },
          { status: 400 }
        );
      }
    }

    const moderation = await moderateAnonymousComment(content);
    if (!moderation.approved) {
      return NextResponse.json(
        { success: false, reason: moderation.reason || "Comment rejected" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();
    const { data: post } = await supabase
      .from("study_korea_posts")
      .select("id,is_published")
      .eq("id", postId)
      .maybeSingle();

    if (!post?.id || !post.is_published) {
      return NextResponse.json(
        { success: false, reason: "Post not found" },
        { status: 404 }
      );
    }

    const nickname = (body.nickname?.trim() || "Anonymous").slice(0, 40);
    const { data: comment, error } = await supabase
      .from("study_korea_comments")
      .insert({
        post_id: postId,
        parent_id: parentId,
        content,
        anonymous_nickname: nickname,
        anonymous_password_hash: hashAnonymousPassword(password),
        author_ip_hash: ipHash,
        moderation_status: "auto_approved",
        is_deleted: false,
      })
      .select(
        "id,post_id,parent_id,content,anonymous_nickname,created_at,upvotes_count"
      )
      .single();

    if (error || !comment) {
      console.error("[comments/create]", error?.message);
      return NextResponse.json(
        { success: false, reason: error?.message || "Insert failed" },
        { status: 500 }
      );
    }

    await logRateLimit(ipHash, "comment");
    await incrementPostCommentCount(postId);

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (e) {
    console.error("[comments/create]", e);
    return NextResponse.json(
      {
        success: false,
        reason: e instanceof Error ? e.message : "Server error",
      },
      { status: 500 }
    );
  }
}
