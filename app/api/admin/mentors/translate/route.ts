import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { getTranslationBackfillStatus } from "@/lib/mentors/queries";
import { runMentorTranslationBatch } from "@/lib/mentors/translate-batch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const status = await getTranslationBackfillStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const batch = await runMentorTranslationBatch();
    const status = await getTranslationBackfillStatus();
    return NextResponse.json({ success: true, ...status, batch });
  } catch (e) {
    console.error("[admin mentors translate]", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Error" },
      { status: 500 }
    );
  }
}
