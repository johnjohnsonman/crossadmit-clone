import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SLUG_NAME_HINTS } from "@/lib/forum/constants";
import { resolveUniversityId } from "@/lib/pipeline/study-korea/university-id";

export const dynamic = "force-dynamic";

const KNOWN_SLUGS = Object.keys(SLUG_NAME_HINTS);

async function countBySource(
  supabase: Awaited<ReturnType<typeof createClient>>,
  source: string
) {
  const { count } = await supabase
    .from("study_korea_posts")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true)
    .eq("source", source);
  return count ?? 0;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const university = searchParams.get("university");
  const source = searchParams.get("source");
  const sort = searchParams.get("sort") === "popular" ? "popular" : "latest";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const withStats = searchParams.get("stats") === "1";

  try {
    const supabase = await createClient();
    let q = supabase
      .from("study_korea_posts")
      .select(
        "id,source,source_id,title,url,author,category,subcategory,university,university_id,language,upvotes,comment_count,ai_summary,ai_summary_kr,source_created_at,created_at",
        { count: "exact" }
      )
      .eq("is_published", true);

    if (category && category !== "all") {
      q = q.or(`subcategory.eq.${category},category.eq.${category}`);
    }

    if (source) {
      q = q.eq("source", source);
    }

    if (university === "other") {
      q = q.or(
        `university.is.null,university.eq.,university.not.in.(${KNOWN_SLUGS.join(",")})`
      );
    } else if (university) {
      const univId = await resolveUniversityId(university);
      if (univId) {
        q = q.or(`university.eq.${university},university_id.eq.${univId}`);
      } else {
        q = q.eq("university", university);
      }
    }

    if (sort === "popular") {
      q = q.order("upvotes", { ascending: false });
    } else {
      q = q.order("source_created_at", { ascending: false, nullsFirst: false });
    }

    const { data, error, count } = await q.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let statsBySource: Record<string, number> | undefined;
    if (withStats || offset === 0) {
      const [naver, reddit, quora, official] = await Promise.all([
        countBySource(supabase, "naver_blog"),
        countBySource(supabase, "reddit"),
        countBySource(supabase, "quora"),
        countBySource(supabase, "studyinkorea"),
      ]);
      statsBySource = {
        naver_blog: naver,
        reddit,
        quora,
        studyinkorea: official,
      };
    }

    return NextResponse.json({
      posts: data ?? [],
      total: count ?? 0,
      statsBySource,
      limit,
      offset,
    });
  } catch (e) {
    console.error("[forum api]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
