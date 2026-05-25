import { NextRequest, NextResponse } from "next/server";
import { verifyCronOrAdmin } from "@/lib/pipeline/study-korea/auth";
import { scrapeSkkuForeign } from "@/lib/scrapers/skku-foreign";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyCronOrAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const limitRaw = request.nextUrl.searchParams.get("limit");
    const parsedLimit = limitRaw ? parseInt(limitRaw, 10) : NaN;
    const maxArticles =
      !Number.isNaN(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 500)
        : 100;

    console.log("[skku-foreign] cron started", { maxArticles });
    const result = await scrapeSkkuForeign({ maxArticles });

    return NextResponse.json({
      success: true,
      source: "skku_foreign",
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[skku-foreign] cron error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
