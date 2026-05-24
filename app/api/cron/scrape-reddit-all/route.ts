import { NextRequest, NextResponse } from "next/server";
import { verifyCronOrAdmin } from "@/lib/pipeline/study-korea/auth";
import { scrapeRedditAllSubreddits } from "@/lib/scrapers/reddit";
import { finishPipelineRun, startPipelineRun } from "@/lib/pipeline/study-korea/runs";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyCronOrAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runId = await startPipelineRun("reddit", "RSS all subreddits (cron)");

  try {
    console.log("[Reddit] scrape-reddit-all started");
    const {
      batches,
      totalSaved,
      totalFailed,
      totalRoutedAdmissions,
      totalRoutedReview,
      totalRoutedGeneral,
      errors,
    } = await scrapeRedditAllSubreddits({ feed: "hot", limitPerSubreddit: 10 });

    const collected = batches.reduce((s, b) => s + b.fetched, 0);
    const processed = batches.reduce((s, b) => s + b.processed, 0);

    await finishPipelineRun(runId, {
      collected,
      processed,
      saved: totalSaved,
      failed: totalFailed,
      status:
        errors.length > 0 && totalSaved === 0
          ? "failed"
          : totalFailed > 0
            ? "partial"
            : "success",
      error_message: errors.slice(0, 5).join("; "),
      routed_admissions: totalRoutedAdmissions,
      routed_review: totalRoutedReview,
      routed_general: totalRoutedGeneral,
    });

    console.log("[Reddit] scrape-reddit-all done", { totalSaved, totalFailed });

    return NextResponse.json({
      success: true,
      totalSaved,
      totalFailed,
      routed_admissions: totalRoutedAdmissions,
      routed_review: totalRoutedReview,
      routed_general: totalRoutedGeneral,
      batches,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Reddit] scrape-reddit-all error:", message);

    await finishPipelineRun(runId, {
      collected: 0,
      processed: 0,
      saved: 0,
      failed: 1,
      status: "failed",
      error_message: message,
    });

    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
