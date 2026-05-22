import { NextRequest, NextResponse } from "next/server";
import { verifyCronOrAdmin } from "@/lib/pipeline/study-korea/auth";
import { scrapeYoutubeStudyKorea } from "@/lib/pipeline/study-korea/youtube";

/** Saves to university_videos only — not study_korea_posts */

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyCronOrAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await scrapeYoutubeStudyKorea();
    return NextResponse.json({
      success: true,
      source: "youtube",
      target: "university_videos",
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
