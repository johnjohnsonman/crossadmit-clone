import { NextRequest, NextResponse } from "next/server";
import { getAdmissions } from "@/lib/supabase/admissions-service";
import { admissionToApiRecord } from "@/lib/supabase/api-map";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const yearParam = searchParams.get("year");
  const admissionType = searchParams.get("admission_type");
  const search = searchParams.get("search");
  const sortRaw = searchParams.get("sort");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

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
      limit: usePagination ? limit : 50,
      offset: usePagination ? offset : 0,
    });

    const records = data.map(admissionToApiRecord);

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
