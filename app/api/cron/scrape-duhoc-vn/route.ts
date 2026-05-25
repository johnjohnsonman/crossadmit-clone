import { NextRequest, NextResponse } from "next/server";
import { verifyCronOrAdmin } from "@/lib/pipeline/study-korea/auth";
import { scrapeDuhocVietnam } from "@/lib/scrapers/duhoc-vn";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyCronOrAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limitRaw = request.nextUrl.searchParams.get("limit");
    const sourceRaw = request.nextUrl.searchParams.get("source");
    const limit = limitRaw
      ? Math.min(Math.max(parseInt(limitRaw, 10), 1), 200)
      : 50;
    const source =
      sourceRaw === "duhoc_alpha" || sourceRaw === "duhoc_sunny"
        ? sourceRaw
        : undefined;

    const result = await scrapeDuhocVietnam({ source, limit });

    return NextResponse.json({
      success: true,
      source: "duhoc_vn",
      requested_source: source ?? "all",
      limit,
      articles_found: result.articles_found,
      per_source: result.per_source,
      collected: result.collected,
      processed: result.processed,
      saved: result.saved,
      failed: result.failed,
      skipped: result.skipped,
      routed_admissions: result.routed_admissions,
      routed_review: result.routed_review,
      routed_general: result.routed_general,
      errors: result.errors.slice(0, 20),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[duhoc_vn] cron error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
