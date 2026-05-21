import { NextRequest, NextResponse } from "next/server";
import {
  getDepartmentsByUniv,
  getUniversities,
} from "@/lib/supabase/universities-service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const country = searchParams.get("country") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const univIdParam = searchParams.get("univ_id");
  const deptSearch = searchParams.get("dept_search") ?? undefined;

  try {
    if (univIdParam) {
      const univId = parseInt(univIdParam, 10);
      if (Number.isNaN(univId)) {
        return NextResponse.json({ error: "invalid univ_id" }, { status: 400 });
      }
      const departments = await getDepartmentsByUniv(univId, deptSearch);
      return NextResponse.json({ departments });
    }

    const universities = await getUniversities({
      country,
      search,
      limit: 30,
    });
    return NextResponse.json({ universities });
  } catch (error) {
    console.error("[universities]", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
