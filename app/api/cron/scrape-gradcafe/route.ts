import { NextRequest, NextResponse } from "next/server";
import { verifyCronOrAdmin } from "@/lib/pipeline/study-korea/auth";
import { scrapeGradCafe } from "@/lib/scrapers/gradcafe";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyCronOrAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limitRaw = request.nextUrl.searchParams.get("limit");
    const limit = limitRaw
      ? Math.min(Math.max(parseInt(limitRaw, 10), 1), 500)
      : 200;

    console.log("[gradcafe] cron started", { limit });
    const result = await scrapeGradCafe({ limit });

    return NextResponse.json({
      success: true,
      source: "gradcafe",
      limit,
      articles_found: result.articles_found,
      per_query: result.per_query,
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
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[gradcafe] cron error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
