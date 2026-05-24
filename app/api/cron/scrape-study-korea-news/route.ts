import { NextRequest, NextResponse } from "next/server";
import { verifyCronOrAdmin } from "@/lib/pipeline/study-korea/auth";
import { scrapeStudyKoreaNews } from "@/lib/scrapers/study-korea-news";

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
      ? Math.min(Math.max(parseInt(limitRaw, 10), 1), 100)
      : undefined;

    console.log("[study-korea-news] cron started", { maxArticles });
    const result = await scrapeStudyKoreaNews({ maxArticles });

    return NextResponse.json({
      success: true,
      source: "study_korea_news",
      articles_found: result.articles_found,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[study-korea-news] cron error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
