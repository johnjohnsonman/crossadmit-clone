import { NextRequest, NextResponse } from "next/server";
import {
  dedupeDepartmentNames,
  searchDepartmentsGlobal,
} from "@/lib/supabase/universities-service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json(
      { departments: [] },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  }

  try {
    const rows = await searchDepartmentsGlobal(q, 100);
    const departments = dedupeDepartmentNames(rows);
    return NextResponse.json(
      { departments },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (e) {
    console.error("[departments/search GET]", e);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
