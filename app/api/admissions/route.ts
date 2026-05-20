import { NextRequest, NextResponse } from "next/server";
import { getAdmissions } from "@/lib/supabase/admissions-service";
import { rowToAdmissionRecord } from "@/lib/supabase/map";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const university = searchParams.get("university");
  const yearParam = searchParams.get("year");
  const source = searchParams.get("source");
  const nationality = searchParams.get("nationality");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  const sortRaw = searchParams.get("sort");
  const admissionType = searchParams.get("admission_type");
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const limit = limitParam ? parseInt(limitParam, 10) : undefined;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
  const year = yearParam ? parseInt(yearParam, 10) : undefined;
  const usePagination = limitParam !== null || offsetParam !== null;

  const sort =
    sortRaw === "popular" || sortRaw === "latest" ? sortRaw : undefined;

  try {
    const { data, total } = await getAdmissions({
      university: university?.trim() || undefined,
      year: year !== undefined && !Number.isNaN(year) ? year : undefined,
      source: source?.trim() || undefined,
      nationality: nationality?.trim() || undefined,
      admission_type: admissionType?.trim() || undefined,
      status: status?.trim() || undefined,
      search: search?.trim() || undefined,
      sort: sort ?? "latest",
      limit: usePagination ? limit : undefined,
      offset: usePagination ? offset : undefined,
    });

    const records = (data ?? []).map(rowToAdmissionRecord);

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
