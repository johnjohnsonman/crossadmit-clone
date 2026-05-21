import { createClient } from "@/lib/supabase/server";

/** admission id → 활성 댓글 수 */
export async function getDcCommentCounts(
  admissionIds: number[]
): Promise<Record<number, number>> {
  if (admissionIds.length === 0) return {};

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select("admission_id, is_deleted")
    .in("admission_id", admissionIds);

  if (error) {
    console.error("getDcCommentCounts:", error);
    return {};
  }

  const counts: Record<number, number> = {};
  for (const row of data ?? []) {
    if (row.is_deleted) continue;
    const aid = row.admission_id as number;
    counts[aid] = (counts[aid] ?? 0) + 1;
  }
  return counts;
}
