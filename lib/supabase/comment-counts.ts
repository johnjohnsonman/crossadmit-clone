import { createClient } from "@/lib/supabase/server";

/** 페이지 단위 목록에서 댓글 수 묶음 조회(RLS 준수) */
export async function getDcCommentCounts(
  admissionIds: string[]
): Promise<Record<string, number>> {
  if (!admissionIds.length) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("admission_id")
    .eq("is_deleted", false)
    .in("admission_id", admissionIds);

  if (error) {
    console.error("getDcCommentCounts:", error);
    return {};
  }

  const out: Record<string, number> = {};
  for (const row of data ?? []) {
    const aid = row.admission_id as string;
    out[aid] = (out[aid] ?? 0) + 1;
  }
  return out;
}
