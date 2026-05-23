import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { testRedditAccessMethods } from "@/lib/pipeline/study-korea/reddit-fetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await testRedditAccessMethods();
    console.log("[test-reddit]", JSON.stringify(result));
    return NextResponse.json(result);
  } catch (e) {
    console.error("[test-reddit]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
