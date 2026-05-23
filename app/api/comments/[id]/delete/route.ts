import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyAnonymousPassword } from "@/lib/security/hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const password = String(body.password ?? "").trim();

    if (!/^\d{4}$/.test(password)) {
      return NextResponse.json(
        { success: false, reason: "Invalid password format" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: comment, error } = await supabase
      .from("study_korea_comments")
      .select("id, anonymous_password_hash, is_deleted")
      .eq("id", id)
      .maybeSingle();

    if (error || !comment) {
      return NextResponse.json(
        { success: false, reason: "Comment not found" },
        { status: 404 }
      );
    }

    if (comment.is_deleted) {
      return NextResponse.json({ success: true });
    }

    const stored = String(comment.anonymous_password_hash ?? "");
    if (!stored || !verifyAnonymousPassword(password, stored)) {
      return NextResponse.json(
        { success: false, reason: "Wrong password" },
        { status: 401 }
      );
    }

    const { error: upErr } = await supabase
      .from("study_korea_comments")
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (upErr) {
      return NextResponse.json(
        { success: false, reason: upErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[comments/delete]", e);
    return NextResponse.json(
      {
        success: false,
        reason: e instanceof Error ? e.message : "Server error",
      },
      { status: 500 }
    );
  }
}
