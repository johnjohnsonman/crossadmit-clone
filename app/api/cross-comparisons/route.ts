import { NextRequest, NextResponse } from "next/server";
import {
  getCrossComparisons,
  getCrossComparisonStats,
} from "@/lib/supabase/universities-service";
import { crossStatToComparisonCard } from "@/lib/supabase/api-map";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const univIdParam = searchParams.get("univ_id");
  const statsOnly = searchParams.get("stats") === "1";

  try {
    if (statsOnly || !univIdParam) {
      const stats = await getCrossComparisonStats({ limit: 40 });
      const comparisons = stats.map(crossStatToComparisonCard);
      return NextResponse.json({
        success: true,
        stats,
        comparisons,
        totalSubmissions: stats.reduce((s, x) => s + x.count, 0),
      });
    }

    const univId = parseInt(univIdParam, 10);
    if (Number.isNaN(univId)) {
      return NextResponse.json({ error: "invalid univ_id" }, { status: 400 });
    }

    const rows = await getCrossComparisons({ univ_id: univId, limit: 100 });
    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("[cross-comparisons]", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
