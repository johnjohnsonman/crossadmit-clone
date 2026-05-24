import { NextRequest, NextResponse } from "next/server";
import { verifyCronOrAdmin } from "@/lib/pipeline/study-korea/auth";
import { scrapeYonseiUicInterviews } from "@/lib/scrapers/yonsei-uic";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyCronOrAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limitRaw = request.nextUrl.searchParams.get("limit");
    const maxArticles = limitRaw
      ? Math.min(Math.max(parseInt(limitRaw, 10), 1), 50)
      : undefined;

    console.log("[yonsei-uic] cron started", { maxArticles });
    const result = await scrapeYonseiUicInterviews({ maxArticles });

    return NextResponse.json({
      success: true,
      source: "yonsei_uic",
      articles_found: result.articles_found,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[yonsei-uic] cron error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
