import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSecret } from "@/lib/admin/verify";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!verifyAdminSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { data: rows, error } = await admin
      .from("admissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("[admin admissions]", error);
      return NextResponse.json({ error: "조회 실패" }, { status: 500 });
    }

    const ids = (rows ?? []).map((r) => r.id).filter(Boolean);
    const counts: Record<number, number> = {};

    if (ids.length > 0) {
      const { data: crows } = await admin
        .from("comments")
        .select("admission_id, is_deleted")
        .in("admission_id", ids);

      for (const row of crows ?? []) {
        if (row.is_deleted) continue;
        const aid = row.admission_id as number;
        counts[aid] = (counts[aid] ?? 0) + 1;
      }
    }

    return NextResponse.json({ admissions: rows ?? [], commentCounts: counts });
  } catch (e) {
    console.error("[admin admissions]", e);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
