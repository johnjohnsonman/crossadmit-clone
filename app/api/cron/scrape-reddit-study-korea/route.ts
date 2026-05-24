import { NextRequest, NextResponse } from "next/server";
import { verifyCronOrAdmin } from "@/lib/pipeline/study-korea/auth";
import { scrapeRedditSubredditBatch } from "@/lib/scrapers/reddit";
import { getSubredditNames } from "@/lib/pipeline/study-korea/reddit-rss";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyCronOrAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const subreddit =
      searchParams.get("subreddit")?.trim() || "StudyInKorea";
    const feed = searchParams.get("feed")?.trim() || "hot";
    const limitRaw = parseInt(searchParams.get("limit") ?? "10", 10);
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 20)
      : 10;

    const validNames = getSubredditNames();
    if (!validNames.some((n) => n.toLowerCase() === subreddit.toLowerCase())) {
      return NextResponse.json(
        {
          error: `Unknown subreddit: ${subreddit}`,
          valid_subreddits: validNames,
        },
        { status: 400 }
      );
    }

    console.log(
      `[Reddit] batch r/${subreddit} feed=${feed} limit=${limit}`
    );

    const result = await scrapeRedditSubredditBatch({
      subreddit,
      feed,
      limit,
    });

    console.log(
      `[Reddit] batch done r/${subreddit}`,
      JSON.stringify({
        fetched: result.fetched,
        saved: result.saved,
        failed: result.failed,
        routed_admissions: result.routed_admissions,
        routed_review: result.routed_review,
        routed_general: result.routed_general,
      })
    );

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Reddit] batch error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
