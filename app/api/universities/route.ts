import { NextRequest, NextResponse } from "next/server";
import {
  getUniversities,
  getUniversityDepartments,
} from "@/lib/supabase/universities-service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const country = searchParams.get("country");
  const search = searchParams.get("search");
  const univIdParam = searchParams.get("univ_id");

  try {
    if (univIdParam) {
      const univId = parseInt(univIdParam, 10);
      if (Number.isNaN(univId)) {
        return NextResponse.json({ error: "invalid univ_id" }, { status: 400 });
      }
      const departments = await getUniversityDepartments(
        univId,
        search?.trim() || undefined
      );
      return NextResponse.json({ departments });
    }

    const universities = await getUniversities({
      country: country?.trim() || undefined,
      search: search?.trim() || undefined,
      limit: 80,
    });

    return NextResponse.json({ universities });
  } catch (e) {
    console.error("[universities GET]", e);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
