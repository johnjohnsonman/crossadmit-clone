import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { getClassifierUsageStats } from "@/lib/classifiers/classifier-usage";
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
        "id,source,title,category,university,is_published,is_featured,upvotes,created_at,source_created_at,ai_summary,ai_summary_kr,ai_title_en,ai_summary_en"
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (postsErr) {
      return NextResponse.json({ error: postsErr.message }, { status: 500 });
    }

    const statsByCategory: Record<string, number> = {};
    const statsBySource: Record<string, number> = {};
    for (const p of posts ?? []) {
      const cat = (p.category as string) || "general";
      statsByCategory[cat] = (statsByCategory[cat] ?? 0) + 1;
      const src = (p.source as string) || "unknown";
      statsBySource[src] = (statsBySource[src] ?? 0) + 1;
    }

    const { data: universities, error: univErr } = await admin
      .from("universities")
      .select("id, name_kr, name_en, intl_url, intl_url_verified")
      .eq("is_active", true)
      .not("name_en", "is", null)
      .neq("name_en", "")
      .order("name_kr", { ascending: true });

    if (univErr) {
      return NextResponse.json({ error: univErr.message }, { status: 500 });
    }

    const { count: reviewPending } = await admin
      .from("admissions")
      .select("id", { count: "exact", head: true })
      .eq("needs_review", true)
      .eq("published", false);

    const classifier = getClassifierUsageStats();

    return NextResponse.json({
      runs: runs ?? [],
      stats: statsByCategory,
      statsBySource,
      posts: posts ?? [],
      totalPosts: (posts ?? []).length,
      universities: universities ?? [],
      reviewPending: reviewPending ?? 0,
      classifier,
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
      universityId?: number;
      intl_url?: string;
      intl_url_verified?: boolean;
    };

    const admin = createAdminClient();

    if (body.universityId != null) {
      const univUpdates: Record<string, string | boolean> = {};
      if (typeof body.intl_url === "string") {
        univUpdates.intl_url = body.intl_url.trim();
      }
      if (typeof body.intl_url_verified === "boolean") {
        univUpdates.intl_url_verified = body.intl_url_verified;
      }
      if (Object.keys(univUpdates).length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 });
      }
      const { data, error } = await admin
        .from("universities")
        .update(univUpdates)
        .eq("id", body.universityId)
        .select("id,name_kr,name_en,intl_url,intl_url_verified")
        .single();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ university: data });
    }

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
