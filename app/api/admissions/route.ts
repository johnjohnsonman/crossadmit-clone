import { NextRequest, NextResponse } from "next/server";
import { getAdmissions } from "@/lib/supabase/admissions-service";
import { getDcCommentCounts } from "@/lib/supabase/comment-counts";
import { admissionToRecord } from "@/lib/supabase/map";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const yearParam = searchParams.get("year");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const sortRaw = searchParams.get("sort");
  const admissionType = searchParams.get("admission_type");
  const search = searchParams.get("search");

  const limit = limitParam ? parseInt(limitParam, 10) : undefined;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
  const year = yearParam ? parseInt(yearParam, 10) : undefined;
  const usePagination = limitParam !== null || offsetParam !== null;

  const sort =
    sortRaw === "likes" || sortRaw === "popular" ? "likes" : "latest";

  try {
    const { data, total } = await getAdmissions({
      year: year !== undefined && !Number.isNaN(year) ? year : undefined,
      admission_type: admissionType?.trim() || undefined,
      search: search?.trim() || undefined,
      sort,
      limit: usePagination ? limit : undefined,
      offset: usePagination ? offset : undefined,
    });

    const ids = (data ?? []).map((r) => r.id);
    const dcCounts = await getDcCommentCounts(ids);

    const records = (data ?? []).map((row) => ({
      ...admissionToRecord(row),
      dcCommentCount: dcCounts[row.id] ?? 0,
    }));

    if (usePagination) {
      return NextResponse.json({
        data: records,
        total,
        limit: limit ?? records.length,
        offset,
      });
    }

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching admissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch admissions" },
      { status: 500 }
    );
  }
}
