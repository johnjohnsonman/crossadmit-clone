import { NextRequest, NextResponse } from "next/server";
import { collectAdmissionPosts } from "@/lib/pipeline/study-korea/admission-collector";
import { verifyCronOrAdmin } from "@/lib/pipeline/study-korea/auth";
import { isNaverConfigured } from "@/lib/pipeline/study-korea/naver-api";

export const maxDuration = 300;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!verifyCronOrAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isNaverConfigured()) {
    return NextResponse.json(
      { error: "NAVER_CLIENT_ID / NAVER_CLIENT_SECRET not configured" },
      { status: 503 }
    );
  }

  try {
    const collected = await collectAdmissionPosts();
    return NextResponse.json({
      success: true,
      count: collected.length,
      saved: collected.length,
      message: `${collected.length}개의 합격 후기 수집됨 (검토 대기)`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[scrape-admissions]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
