import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();

    const { data: runs, error: runsErr } = await admin
      .from("pipeline_runs_study_korea")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (runsErr) {
      return NextResponse.json({ error: runsErr.message }, { status: 500 });
    }

    const { data: posts, error: postsErr } = await admin
      .from("study_korea_posts")
      .select(
        "id,source,title,category,university,is_published,is_featured,upvotes,created_at,source_created_at"
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (postsErr) {
      return NextResponse.json({ error: postsErr.message }, { status: 500 });
    }

    const stats: Record<string, number> = {};
    for (const p of posts ?? []) {
      const cat = (p.category as string) || "general";
      stats[cat] = (stats[cat] ?? 0) + 1;
    }

    return NextResponse.json({
      runs: runs ?? [],
      stats,
      posts: posts ?? [],
      totalPosts: (posts ?? []).length,
    });
  } catch (e) {
    console.error("[admin study-korea]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      is_published?: boolean;
      is_featured?: boolean;
    };

    if (!body.id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const updates: Record<string, boolean> = {};
    if (typeof body.is_published === "boolean") {
      updates.is_published = body.is_published;
    }
    if (typeof body.is_featured === "boolean") {
      updates.is_featured = body.is_featured;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("study_korea_posts")
      .update(updates)
      .eq("id", body.id)
      .select("id,is_published,is_featured")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ post: data });
  } catch (e) {
    console.error("[admin study-korea patch]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
