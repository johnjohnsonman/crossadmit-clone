import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** ilike 패턴에서 %, _, \ 이스케이프 */
function escapeIlikePattern(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/** text[] cs 필터용 — 따옴표 이스케이프 */
function escapeForTagCs(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const searchRaw = searchParams.get("search")?.trim() ?? "";
    const university = searchParams.get("university")?.trim() ?? "";
    const language = searchParams.get("language")?.trim() ?? "";
    const contentType = searchParams.get("content_type")?.trim() ?? "";
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const supabase = await createClient();

    let query = supabase
      .from("university_videos")
      .select("*", { count: "exact" })
      .order("view_count", { ascending: false })
      .range(offset, offset + limit - 1);

    if (searchRaw) {
      const safeTitle = escapeIlikePattern(searchRaw);
      const tagQuoted = escapeForTagCs(searchRaw);
      query = query.or(
        `university_tags.cs.{"${tagQuoted}"},title.ilike.%${safeTitle}%`
      );
    }

    if (language) {
      query = query.eq("language", language);
    }

    if (contentType) {
      query = query.eq("content_type", contentType);
    }

    if (university) {
      query = query.contains("university_tags", [university]);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to fetch videos" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: data ?? [],
      total: count ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
