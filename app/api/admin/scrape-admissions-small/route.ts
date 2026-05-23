import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { collectAdmissionPosts } from "@/lib/pipeline/study-korea/admission-collector";
import { isNaverConfigured } from "@/lib/pipeline/study-korea/naver-api";

export const maxDuration = 300;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isNaverConfigured()) {
    return NextResponse.json(
      {
        error: "NAVER_CLIENT_ID / NAVER_CLIENT_SECRET not configured",
        naver_configured: false,
      },
      { status: 503 }
    );
  }

  let limit = 10;
  let startIndex = 0;
  try {
    const body = (await request.json()) as {
      limit?: number;
      startIndex?: number;
    };
    if (typeof body.limit === "number" && body.limit > 0) {
      limit = Math.min(body.limit, 200);
    }
    if (typeof body.startIndex === "number" && body.startIndex >= 0) {
      startIndex = body.startIndex;
    }
  } catch {
    /* default 10 */
  }

  try {
    const stats = await collectAdmissionPosts({
      targetNewCount: limit,
      startQueryIndex: startIndex,
      signal: request.signal,
    });

    return NextResponse.json({
      success: true,
      new: stats.newCount,
      duplicates: stats.dupCount,
      filtered: stats.filteredCount,
      insert_failed: stats.insertFailedCount,
      api_errors: stats.apiErrors,
      queries_used: stats.queriesUsed,
      next_start_index: stats.nextStartIndex,
      sample_titles: stats.sampleTitles,
      aborted: stats.aborted,
      naver_configured: stats.naverConfigured,
      message: stats.aborted
        ? `중단됨 — 신규 ${stats.newCount}건`
        : `신규 ${stats.newCount}건, 중복 ${stats.dupCount}건`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[scrape-admissions-small]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
