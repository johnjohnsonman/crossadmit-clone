import { NextRequest, NextResponse } from "next/server";
import { scrapeStudyInKorea } from "@/lib/pipeline/scrape-studyinkorea";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subreddit = searchParams.get("subreddit") || "studyinkorea";
  const limit = parseInt(searchParams.get("limit") || "25", 10);
  const sortParam = searchParams.get("sort");
  const sort =
    sortParam === "hot" || sortParam === "top" || sortParam === "new"
      ? sortParam
      : "new";

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    let result;

    if (subreddit === "studyinkorea") {
      result = await scrapeStudyInKorea({ limit, sort });
    } else {
      return NextResponse.json(
        { error: `Subreddit "${subreddit}" not yet supported` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      subreddit,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        subreddit,
      },
      { status: 500 }
    );
  }
}
