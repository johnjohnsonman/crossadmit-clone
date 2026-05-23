import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { getMentorViewStats } from "@/lib/mentors/view-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await getMentorViewStats();
    return NextResponse.json({ success: true, ...stats });
  } catch (e) {
    console.error("[admin mentor view-stats]", e);
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Server error",
      },
      { status: 500 }
    );
  }
}
