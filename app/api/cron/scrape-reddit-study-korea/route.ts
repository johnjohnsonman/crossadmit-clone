import { NextRequest, NextResponse } from "next/server";
import { verifyCronOrAdmin } from "@/lib/pipeline/study-korea/auth";
import { scrapeRedditStudyKorea } from "@/lib/pipeline/study-korea/reddit";

/** Reddit fetch: Mozilla UA + Accept headers, UA rotation, old.reddit fallback (lib/pipeline/study-korea/reddit-fetch.ts) */

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyCronOrAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await scrapeRedditStudyKorea();
    return NextResponse.json({
      success: true,
      source: "reddit",
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
