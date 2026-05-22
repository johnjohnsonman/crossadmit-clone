import { NextResponse } from "next/server";
import { getUniversitiesWithIntlUrl } from "@/lib/supabase/universities-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const universities = await getUniversitiesWithIntlUrl();
    return NextResponse.json({ universities });
  } catch (e) {
    console.error("[universities/intl GET]", e);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }
}
