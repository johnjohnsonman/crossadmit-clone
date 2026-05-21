import { NextResponse } from "next/server";
import { getRecentRegisteredSchools } from "@/lib/supabase/admissions-service";

export async function GET() {
  try {
    const items = await getRecentRegisteredSchools(16);
    return NextResponse.json({ items });
  } catch (e) {
    console.error("[ticker]", e);
    return NextResponse.json({ items: [] });
  }
}
