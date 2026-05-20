import { NextRequest, NextResponse } from "next/server";
import { rowToAdmissionRecord } from "@/lib/supabase/map";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const university = searchParams.get("university");
  const yearParam = searchParams.get("year");
  const source = searchParams.get("source");
  const nationality = searchParams.get("nationality");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  const limit = limitParam ? parseInt(limitParam, 10) : undefined;
  const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
  const year = yearParam ? parseInt(yearParam, 10) : undefined;
  const usePagination = limitParam !== null || offsetParam !== null;

  try {
    const supabase = await createClient();

    let query = supabase
      .from("admissions")
      .select("*", { count: usePagination ? "exact" : undefined })
      .order("created_at", { ascending: false });

    if (university) {
      query = query.ilike("university", `%${university}%`);
    }
    if (year !== undefined && !Number.isNaN(year)) {
      query = query.eq("year", year);
    }
    if (source) {
      query = query.eq("source", source);
    }
    if (nationality) {
      query = query.eq("nationality", nationality);
    }

    if (limit !== undefined && !Number.isNaN(limit)) {
      const from = offset;
      const to = offset + limit - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Supabase admissions query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch admissions" },
        { status: 500 }
      );
    }

    const records = (data ?? []).map(rowToAdmissionRecord);

    if (usePagination) {
      return NextResponse.json({
        data: records,
        total: count ?? records.length,
        limit: limit ?? records.length,
        offset,
      });
    }

    return NextResponse.json(records);
  } catch (error) {
    console.error("Error fetching admissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
