import { NextRequest, NextResponse } from "next/server";
import { verifyCronOrAdmin } from "@/lib/pipeline/study-korea/auth";
import {
  getGuideQueueStatus,
  processNextGuideTopic,
} from "@/lib/ai-guides/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!verifyCronOrAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const before = await getGuideQueueStatus();
    if (before.pending === 0) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: "No pending topics",
        ...before,
      });
    }

    const result = await processNextGuideTopic();
    const after = await getGuideQueueStatus();

    return NextResponse.json({
      ok: true,
      skipped: false,
      result,
      ...after,
    });
  } catch (e) {
    console.error("[cron generate-ai-guide-daily]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
