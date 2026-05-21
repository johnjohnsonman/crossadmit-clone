import { createClient } from "@/lib/supabase/server";
import type { Admission, CrossComparison } from "@/lib/supabase/types";

export type AdmissionsSort = "latest" | "popular" | "likes";

export interface GetAdmissionsParams {
  year?: number;
  admission_type?: string;
  search?: string;
  sort?: AdmissionsSort;
  limit?: number;
  offset?: number;
}

function escapeIlike(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

const ADMISSION_SELECT = `
  *,
  admission_schools (*)
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySort(query: any, sort: AdmissionsSort) {
  let q = query.order("is_featured", { ascending: false });
  if (sort === "likes" || sort === "popular") {
    q = q.order("likes_count", { ascending: false });
  }
  return q.order("created_at", { ascending: false });
}

export async function getAdmissions(
  params: GetAdmissionsParams
): Promise<{ data: Admission[]; total: number }> {
  const supabase = await createClient();

  const sortMode =
    params.sort === "likes" || params.sort === "popular" ? "likes" : "latest";

  let query = supabase
    .from("admissions")
    .select(ADMISSION_SELECT, { count: "exact" })
    .eq("published", true);

  if (params.year !== undefined && !Number.isNaN(params.year)) {
    query = query.eq("year", params.year);
  }

  if (params.search?.trim()) {
    const safe = escapeIlike(params.search.trim());
    query = query.or(
      `title.ilike.%${safe}%,user_handle.ilike.%${safe}%`
    );
  }

  query = applySort(query, sortMode);

  const from = params.offset ?? 0;
  const lim = params.limit;
  if (lim !== undefined && !Number.isNaN(lim) && lim > 0) {
    query = query.range(from, from + lim - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("getAdmissions:", error);
    throw new Error(error.message);
  }

  let rows = (data ?? []) as Admission[];

  if (params.admission_type?.trim()) {
    const type = params.admission_type.trim();
    rows = rows.filter((a) =>
      (a.admission_schools ?? []).some((s) => s.admission_type === type)
    );
  }

  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    rows = rows.filter((a) => {
      if (
        a.title?.toLowerCase().includes(q) ||
        a.user_handle?.toLowerCase().includes(q)
      ) {
        return true;
      }
      return (a.admission_schools ?? []).some(
        (s) =>
          s.univ_name?.toLowerCase().includes(q) ||
          s.dept_name?.toLowerCase().includes(q)
      );
    });
  }

  return { data: rows, total: count ?? rows.length };
}

export async function getAdmissionById(
  id: number
): Promise<(Admission & { cross_comparisons?: CrossComparison[] }) | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("admissions")
    .select(`${ADMISSION_SELECT}`)
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error("getAdmissionById:", error);
    throw new Error(error.message);
  }

  if (!data) return null;

  const { data: crosses, error: crossErr } = await supabase
    .from("cross_comparisons")
    .select("*")
    .eq("admission_id", id);

  if (crossErr) {
    console.error("getAdmissionById cross:", crossErr);
  }

  return {
    ...(data as Admission),
    cross_comparisons: (crosses ?? []) as CrossComparison[],
  };
}

export async function getAdmissionsCount(
  params: Omit<GetAdmissionsParams, "limit" | "offset" | "sort">
): Promise<number> {
  const { total } = await getAdmissions({ ...params, limit: 1, offset: 0 });
  return total;
}

/** 상단 티커: 최근 등록 학교 */
export async function getRecentRegisteredSchools(limit = 12): Promise<
  {
    admissionId: number;
    univName: string;
    deptName: string;
  }[]
> {
  const supabase = await createClient();
  const { data: schools, error } = await supabase
    .from("admission_schools")
    .select("admission_id, univ_name, dept_name")
    .eq("is_regist", true)
    .order("id", { ascending: false })
    .limit(limit * 3);

  if (error || !schools?.length) {
    console.error("getRecentRegisteredSchools:", error);
    return [];
  }

  const admissionIds = [
    ...new Set(schools.map((s) => s.admission_id as number)),
  ];
  const { data: published } = await supabase
    .from("admissions")
    .select("id")
    .in("id", admissionIds)
    .eq("published", true);

  const pubSet = new Set((published ?? []).map((a) => a.id));
  const out: { admissionId: number; univName: string; deptName: string }[] =
    [];

  for (const s of schools) {
    const aid = s.admission_id as number;
    if (!pubSet.has(aid)) continue;
    out.push({
      admissionId: aid,
      univName: String(s.univ_name ?? ""),
      deptName: String(s.dept_name ?? ""),
    });
    if (out.length >= limit) break;
  }

  return out;
}
