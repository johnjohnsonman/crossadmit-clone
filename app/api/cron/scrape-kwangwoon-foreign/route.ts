import { NextRequest, NextResponse } from "next/server";
import { verifyCronOrAdmin } from "@/lib/pipeline/study-korea/auth";
import { scrapeKwangwoonForeign } from "@/lib/scrapers/kwangwoon-foreign";

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

    console.log("[kwangwoon-foreign] cron started", { maxArticles });
    const result = await scrapeKwangwoonForeign({ maxArticles });

    return NextResponse.json({
      success: true,
      source: "kwangwoon_foreign",
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[kwangwoon-foreign] cron error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
