import { NextRequest, NextResponse } from "next/server";
import { verifyCronOrAdmin } from "@/lib/pipeline/study-korea/auth";
import {
  generateAndTranslateNextGuide,
  getGuideQueueStatus,
} from "@/lib/ai-guides/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (!verifyCronOrAdmin(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const before = await getGuideQueueStatus();
    if (before.pending === 0) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "No pending topics",
        ...before,
      });
    }

    const pipeline = await generateAndTranslateNextGuide();
    const after = await getGuideQueueStatus();

    return NextResponse.json({
      ...after,
      ...pipeline,
    });
  } catch (e) {
    console.error("[cron generate-ai-guide-daily]", e);
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Server error",
      },
      { status: 500 }
    );
  }
}
