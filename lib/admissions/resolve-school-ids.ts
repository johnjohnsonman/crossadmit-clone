import { escapeIlikeForPostgrest } from "@/lib/admissions/university-search";
import type { createAdminClient } from "@/lib/supabase/admin";

type AdminClient = ReturnType<typeof createAdminClient>;

/** DB에 없는 univ_id는 0으로 (자유 텍스트 univ_name만 저장) */
export async function normalizeUnivId(
  admin: AdminClient,
  clientId?: number
): Promise<number> {
  if (!clientId || clientId <= 0) return 0;
  const { data } = await admin
    .from("universities")
    .select("id")
    .eq("id", clientId)
    .eq("is_active", true)
    .maybeSingle();
  return data?.id ? (data.id as number) : 0;
}

/**
 * university_departments 매칭 시도.
 * 실패·미존재 dept_id는 0 (dept_name 텍스트만 저장).
 */
export async function resolveDepartmentId(
  admin: AdminClient,
  univId: number,
  deptName: string,
  clientDeptId?: number
): Promise<number> {
  if (!univId || univId <= 0 || !deptName.trim()) return 0;

  if (clientDeptId && clientDeptId > 0) {
    const { data: byId } = await admin
      .from("university_departments")
      .select("id")
      .eq("id", clientDeptId)
      .eq("univ_id", univId)
      .maybeSingle();
    if (byId?.id) return byId.id as number;
  }

  const safe = escapeIlikeForPostgrest(deptName.trim());
  if (!safe) return 0;

  const { data: byName } = await admin
    .from("university_departments")
    .select("id")
    .eq("univ_id", univId)
    .or(`dept_name.ilike.%${safe}%,dept_name_en.ilike.%${safe}%`)
    .limit(1)
    .maybeSingle();

  return (byName?.id as number) ?? 0;
}
