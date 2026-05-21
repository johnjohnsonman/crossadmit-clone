import { NextResponse } from "next/server";
import { getAdmissionById } from "@/lib/supabase/admissions-service";
import { admissionToApiRecord } from "@/lib/supabase/api-map";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  try {
    const row = await getAdmissionById(id);
    if (!row) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
    return NextResponse.json({
      ...admissionToApiRecord(row),
      cross_comparisons: row.cross_comparisons ?? [],
    });
  } catch (error) {
    console.error("GET admission:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
