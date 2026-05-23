import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import {
  getMentorUniversityRematchStats,
  runMentorUniversityRematchBatch,
} from "@/lib/mentors/rematch-universities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const stats = await getMentorUniversityRematchStats();
    return NextResponse.json({ success: true, ...stats });
  } catch (e) {
    console.error("[rematch-universities GET]", e);
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
    const result = await runMentorUniversityRematchBatch();
    return NextResponse.json(result);
  } catch (e) {
    console.error("[rematch-universities POST]", e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
