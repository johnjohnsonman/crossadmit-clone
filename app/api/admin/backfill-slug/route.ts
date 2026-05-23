import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getSlugBackfillStatus,
  runSlugBackfillBatch,
} from "@/lib/pipeline/study-korea/backfill-slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const status = await getSlugBackfillStatus(admin);
    return NextResponse.json(status);
  } catch (e) {
    console.error("[admin backfill-slug GET]", e);
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
    const admin = createAdminClient();
    const batch = await runSlugBackfillBatch(admin, 50);
    const status = await getSlugBackfillStatus(admin);
    return NextResponse.json({ ...status, batch });
  } catch (e) {
    console.error("[admin backfill-slug POST]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
