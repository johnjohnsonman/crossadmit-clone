import { NextRequest, NextResponse } from "next/server";
import {
  getCrossComparisons,
  getCrossComparisonStats,
} from "@/lib/supabase/universities-service";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const univIdParam = searchParams.get("univ_id");
  const statsOnly = searchParams.get("stats") === "1";

  try {
    if (statsOnly || !univIdParam) {
      const stats = await getCrossComparisonStats();
      if (univIdParam) {
        const uid = parseInt(univIdParam, 10);
        if (!Number.isNaN(uid)) {
          const filtered = stats.filter(
            (s) => s.univ_id_win === uid || s.univ_id_lose === uid
          );
          return NextResponse.json({ success: true, stats: filtered });
        }
      }
      return NextResponse.json({ success: true, stats });
    }

    const univId = parseInt(univIdParam, 10);
    if (Number.isNaN(univId)) {
      return NextResponse.json({ error: "invalid univ_id" }, { status: 400 });
    }

    const rows = await getCrossComparisons({ univ_id: univId, limit: 500 });
    const stats = await getCrossComparisonStats();
    const related = stats.filter(
      (s) => s.univ_id_win === univId || s.univ_id_lose === univId
    );

    return NextResponse.json({
      success: true,
      comparisons: rows,
      stats: related,
    });
  } catch (e) {
    console.error("[cross-comparisons GET]", e);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
