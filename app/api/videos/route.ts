import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const university = searchParams.get("university");
    const language = searchParams.get("language");
    const contentType = searchParams.get("content_type");
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const supabase = await createClient();

    let query = supabase
      .from("university_videos")
      .select("*", { count: "exact" })
      .order("view_count", { ascending: false })
      .range(offset, offset + limit - 1);

    if (language && language !== "all") {
      query = query.eq("language", language);
    }
    if (contentType && contentType !== "all") {
      query = query.eq("content_type", contentType);
    }
    if (university && university !== "all") {
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
