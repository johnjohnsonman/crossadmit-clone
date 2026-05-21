import { NextResponse } from "next/server";
import { getRecentRegistrations } from "@/lib/supabase/admissions-service";

export async function GET() {
  try {
    const schools = await getRecentRegistrations(15);
    const items = schools.map((s) => ({
      admission_id: s.admission_id,
      univ_name: s.univ_name,
      dept_name: s.dept_name,
    }));
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[ticker]", error);
    return NextResponse.json({ items: [] });
  }
}
