import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const university = searchParams.get("university");
  const language = searchParams.get("language");
  const sort = searchParams.get("sort") === "popular" ? "popular" : "latest";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  try {
    const supabase = await createClient();
    let q = supabase
      .from("study_korea_posts")
      .select(
        "id,source,title,url,author,category,university,language,upvotes,comment_count,ai_summary,ai_summary_kr,ai_tags,is_featured,source_created_at,created_at",
        { count: "exact" }
      )
      .eq("is_published", true);

    if (category && category !== "all") {
      q = q.eq("category", category);
    }
    if (university) {
      q = q.eq("university", university);
    }
    if (language) {
      q = q.eq("language", language);
    }

    if (sort === "popular") {
      q = q.order("upvotes", { ascending: false });
    } else {
      q = q.order("source_created_at", { ascending: false, nullsFirst: false });
    }

    const { data, error, count } = await q.range(offset, offset + limit - 1);

    if (error) {
      console.error("[study-korea api]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      posts: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (e) {
    console.error("[study-korea api]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
