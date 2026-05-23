import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getReclassifyStatus,
  runReclassifyBatch,
} from "@/lib/pipeline/study-korea/reclassify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const status = await getReclassifyStatus(admin);
    return NextResponse.json(status);
  } catch (e) {
    console.error("[admin reclassify GET]", e);
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
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured" },
        { status: 500 }
      );
    }

    let batchSize = 10;
    try {
      const body = await request.json();
      if (typeof body?.batch === "number" && body.batch > 0) {
        batchSize = Math.min(body.batch, 20);
      }
    } catch {
      /* empty body OK */
    }

    const admin = createAdminClient();
    const batch = await runReclassifyBatch(admin, batchSize);
    const status = await getReclassifyStatus(admin);

    return NextResponse.json({
      processed: batch.processed,
      kept_published: batch.kept_published,
      hidden: batch.hidden,
      failed: batch.failed,
      remaining: status.remaining,
      total: status.total,
      reclassified: status.reclassified,
      logs: batch.logs,
    });
  } catch (e) {
    console.error("[admin reclassify POST]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
