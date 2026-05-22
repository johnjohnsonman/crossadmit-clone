import { NextRequest, NextResponse } from "next/server";
import { verifyCronOrAdmin } from "@/lib/pipeline/study-korea/auth";
import { scrapeStudyInKoreaGov } from "@/lib/pipeline/study-korea/studyinkorea-gov";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Study in Korea 공식 사이트 (studyinkorea.go.kr) */
export async function GET(request: NextRequest) {
  if (!verifyCronOrAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await scrapeStudyInKoreaGov();
    return NextResponse.json({ success: true, source: "studyinkorea", ...result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
