import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import {
  getGuideQueueStatus,
  processNextGuideTopic,
} from "@/lib/ai-guides/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await getGuideQueueStatus();
    return NextResponse.json(status);
  } catch (e) {
    console.error("[admin ai-guides GET]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processNextGuideTopic();
    const status = await getGuideQueueStatus();
    return NextResponse.json({ ...status, result });
  } catch (e) {
    console.error("[admin ai-guides POST]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
