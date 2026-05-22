import { NextRequest, NextResponse } from "next/server";
import { verifyCronOrAdmin } from "@/lib/pipeline/study-korea/auth";
import { scrapeRedditStudyKorea } from "@/lib/pipeline/study-korea/reddit";
import { scrapeYoutubeStudyKorea } from "@/lib/pipeline/study-korea/youtube";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyCronOrAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reddit = await scrapeRedditStudyKorea();
    const youtube = await scrapeYoutubeStudyKorea();

    return NextResponse.json({
      success: true,
      reddit,
      youtube,
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
