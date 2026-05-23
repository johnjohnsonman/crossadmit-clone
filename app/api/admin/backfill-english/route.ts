import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getEnglishBackfillStatus,
  runEnglishBackfillBatch,
} from "@/lib/pipeline/study-korea/backfill-english";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
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

    const admin = createAdminClient();
    const status = await getEnglishBackfillStatus(admin);
    return NextResponse.json(status);
  } catch (e) {
    console.error("[admin backfill-english GET]", e);
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

    const admin = createAdminClient();
    const batch = await runEnglishBackfillBatch(admin, 10);
    const status = await getEnglishBackfillStatus(admin);

    return NextResponse.json({
      ...status,
      batch,
    });
  } catch (e) {
    console.error("[admin backfill-english POST]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
