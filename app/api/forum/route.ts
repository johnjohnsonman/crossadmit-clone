import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enrichStudyKoreaPosts } from "@/lib/forum/enrich-posts";
import { SLUG_NAME_HINTS } from "@/lib/forum/constants";
import { buildForumCategoryOrFilter } from "@/lib/forum/category-filter";
import {
  applyForumPostExclusions,
  isForumExcludedCategory,
} from "@/lib/forum/exclusions";
import { resolveUniversityId } from "@/lib/pipeline/study-korea/university-id";

export const dynamic = "force-dynamic";

const KNOWN_SLUGS = Object.keys(SLUG_NAME_HINTS);

function escapeIlike(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

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
  const universityIdParam = searchParams.get("university_id");
  const universityText = searchParams.get("university_text");
  const source = searchParams.get("source");
  const sortParam = searchParams.get("sort") || "hot";
  const sort =
    sortParam === "popular"
      ? "popular"
      : sortParam === "new" || sortParam === "latest"
        ? "new"
        : sortParam === "top"
          ? "top"
          : "hot";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 50);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const withStats = searchParams.get("stats") === "1";
  const kind = searchParams.get("kind"); // guides | discussions

  try {
    if (category && isForumExcludedCategory(category)) {
      return NextResponse.json({
        posts: [],
        total: 0,
        limit,
        offset,
      });
    }

    const supabase = await createClient();
    let q = applyForumPostExclusions(
      supabase
        .from("study_korea_posts")
        .select(
          "id,source,source_id,title,url,author,category,subcategory,university,university_id,language,upvotes,comment_count,upvotes_count,downvotes_count,comments_count,views_count,slug,post_type,is_ai_generated,ai_sources,ai_last_updated,ai_summary,ai_summary_kr,ai_title_en,ai_summary_en,ai_content_en,source_created_at,created_at",
          { count: "exact" }
        )
        .eq("is_published", true)
        .or(
          "moderation_status.in.(approved,auto_approved),moderation_status.is.null"
        )
    );

    if (category && category !== "all") {
      q = q.or(buildForumCategoryOrFilter(category));
    }

    if (source) {
      q = q.eq("source", source);
    }

    if (kind === "guides") {
      q = q.eq("post_type", "ai_guide");
    } else if (kind === "discussions") {
      q = q.neq("post_type", "ai_guide");
    }

    const univId = universityIdParam
      ? parseInt(universityIdParam, 10)
      : NaN;

    if (!Number.isNaN(univId) && univId > 0) {
      const { data: univRow } = await supabase
        .from("universities")
        .select("name_kr, name_en")
        .eq("id", univId)
        .maybeSingle();
      const parts = [`university_id.eq.${univId}`];
      if (univRow?.name_kr) {
        const safeKr = escapeIlike(String(univRow.name_kr).slice(0, 20));
        parts.push(`university.ilike.%${safeKr}%`);
      }
      q = q.or(parts.join(","));
    } else if (universityText?.trim()) {
      const safe = escapeIlike(universityText.trim());
      q = q.or(`university.ilike.%${safe}%`);
    } else if (university === "other") {
      q = q.or(
        `university.is.null,university.eq.,university.not.in.(${KNOWN_SLUGS.join(",")})`
      );
    } else if (university) {
      const resolvedId = await resolveUniversityId(university);
      if (resolvedId) {
        q = q.or(`university.eq.${university},university_id.eq.${resolvedId}`);
      } else {
        q = q.eq("university", university);
      }
    }

    if (sort === "hot" || sort === "popular" || sort === "top") {
      q = q
        .order("upvotes_count", { ascending: false, nullsFirst: false })
        .order("upvotes", { ascending: false });
    } else {
      q = q.order("source_created_at", { ascending: false, nullsFirst: false });
    }

    const { data, error, count } = await q.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const enriched = await enrichStudyKoreaPosts(data ?? []);

    let statsBySource: Record<string, number> | undefined;
    if (withStats || offset === 0) {
      const [naverBlog, naverNews, reddit, quora, official] = await Promise.all([
        countBySource(supabase, "naver_blog"),
        countBySource(supabase, "naver_news"),
        countBySource(supabase, "reddit"),
        countBySource(supabase, "quora"),
        countBySource(supabase, "studyinkorea"),
      ]);
      statsBySource = {
        naver_blog: naverBlog,
        naver_news: naverNews,
        reddit,
        quora,
        studyinkorea: official,
      };
    }

    return NextResponse.json({
      posts: enriched,
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
