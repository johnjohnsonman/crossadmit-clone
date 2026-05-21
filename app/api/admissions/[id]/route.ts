import { NextRequest, NextResponse } from "next/server";
import { getAdmissionById } from "@/lib/supabase/admissions-service";
import { getDcCommentCounts } from "@/lib/supabase/comment-counts";
import { admissionToRecord } from "@/lib/supabase/map";

function parseId(raw: string): number | null {
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idRaw } = await params;
  const id = parseId(idRaw);
  if (id === null) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  try {
    const row = await getAdmissionById(id);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const dcCounts = await getDcCommentCounts([id]);
    const record = {
      ...admissionToRecord(row),
      dcCommentCount: dcCounts[id] ?? 0,
    };

    return NextResponse.json(record);
  } catch (e) {
    console.error("[admissions GET id]", e);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
