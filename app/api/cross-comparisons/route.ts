import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
import {
  getCrossComparisons,
  getCrossComparisonStats,
  type CrossComparisonSort,
} from "@/lib/supabase/universities-service";

function parseSort(raw: string | null): CrossComparisonSort {
  if (raw === "popular" || raw === "random" || raw === "latest") {
    return raw;
  }
  return "latest";
}

function parseId(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? undefined : n;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const univIdParam = searchParams.get("univ_id");
  const statsOnly = searchParams.get("stats") === "1";
  const sort = parseSort(searchParams.get("sort"));
  const univA = parseId(searchParams.get("univ_a"));
  const univB = parseId(searchParams.get("univ_b"));
  const localeParam = searchParams.get("locale");
  const locale =
    localeParam === "en" || localeParam === "ko" ? localeParam : undefined;

  try {
    if (statsOnly || !univIdParam) {
      const stats = await getCrossComparisonStats({
        sort,
        univ_a: univA,
        univ_b: univB,
        locale,
      });

      if (univIdParam && univA === undefined && univB === undefined) {
        const uid = parseInt(univIdParam, 10);
        if (!Number.isNaN(uid)) {
          const filtered = stats.filter(
            (s) => s.univ_id_win === uid || s.univ_id_lose === uid
          );
          return NextResponse.json({ success: true, stats: filtered });
        }
      }
      return NextResponse.json(
        { success: true, stats },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    const univId = parseInt(univIdParam, 10);
    if (Number.isNaN(univId)) {
      return NextResponse.json({ error: "invalid univ_id" }, { status: 400 });
    }

    const rows = await getCrossComparisons({ univ_id: univId, limit: 500 });
    const stats = await getCrossComparisonStats({ sort: "popular" });
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
