import { createClient } from "@/lib/supabase/server";
import type { Admission, CrossComparison } from "@/lib/supabase/types";

export type AdmissionsSort = "latest" | "likes" | "views" | "oldest";

export type AdmissionStatusFilter = "accept" | "regist" | "reject";

export interface GetAdmissionsParams {
  year?: number;
  year_before?: number;
  admission_type?: string;
  status?: AdmissionStatusFilter;
  search?: string;
  univ_id?: number;
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

/** 상세 페이지 — source_url 등 필드 누락 방지 */
const ADMISSION_DETAIL_SELECT = `
  id,
  user_handle,
  year,
  year_end,
  title,
  input_score,
  input_gpa,
  input_specialty,
  view_count,
  likes_count,
  is_verified,
  is_featured,
  published,
  source,
  source_url,
  created_at,
  admission_schools (*)
`;

function intersectIds(
  current: number[] | null,
  next: number[]
): number[] | null {
  if (next.length === 0) return [];
  if (current === null) return [...next];
  const set = new Set(next);
  return current.filter((id) => set.has(id));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySort(query: any, sort: AdmissionsSort) {
  if (sort === "likes") {
    return query
      .order("likes_count", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
  }
  if (sort === "views") {
    return query
      .order("view_count", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
  }
  if (sort === "oldest") {
    return query
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
  }
  return query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
}

async function schoolFilterIds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  params: GetAdmissionsParams
): Promise<number[] | null> {
  let ids: number[] | null = null;

  if (params.univ_id !== undefined && !Number.isNaN(params.univ_id)) {
    const { data, error } = await supabase
      .from("admission_schools")
      .select("admission_id")
      .eq("univ_id", params.univ_id);
    if (error) throw new Error(error.message);
    const found = [
      ...new Set((data ?? []).map((r: { admission_id: number }) => r.admission_id)),
    ];
    ids = intersectIds(ids, found);
    if (ids?.length === 0) return [];
  }

  if (params.search?.trim()) {
    const safe = escapeIlike(params.search.trim());
    const { data, error } = await supabase
      .from("admission_schools")
      .select("admission_id")
      .or(`univ_name.ilike.%${safe}%,dept_name.ilike.%${safe}%`);
    if (error) throw new Error(error.message);
    const found = [
      ...new Set((data ?? []).map((r: { admission_id: number }) => r.admission_id)),
    ];
    ids = intersectIds(ids, found);
    if (ids?.length === 0) return [];
  }

  if (params.admission_type?.trim()) {
    const type = params.admission_type.trim();
    const { data, error } = await supabase
      .from("admission_schools")
      .select("admission_id")
      .eq("admission_type", type);
    if (error) throw new Error(error.message);
    const found = [
      ...new Set((data ?? []).map((r: { admission_id: number }) => r.admission_id)),
    ];
    ids = intersectIds(ids, found);
    if (ids?.length === 0) return [];
  }

  if (params.status) {
    let q = supabase.from("admission_schools").select("admission_id");
    if (params.status === "regist") {
      q = q.eq("is_regist", true);
    } else if (params.status === "accept") {
      q = q.eq("is_accept", true);
    } else if (params.status === "reject") {
      q = q.eq("is_apply", true).eq("is_accept", false).eq("is_regist", false);
    }
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const found = [
      ...new Set((data ?? []).map((r: { admission_id: number }) => r.admission_id)),
    ];
    ids = intersectIds(ids, found);
    if (ids?.length === 0) return [];
  }

  return ids;
}

export async function getAdmissions(
  params: GetAdmissionsParams
): Promise<{ data: Admission[]; total: number }> {
  const supabase = await createClient();

  const sortMode: AdmissionsSort =
    params.sort === "likes" ||
    params.sort === "views" ||
    params.sort === "oldest"
      ? params.sort
      : "latest";

  const schoolIds = await schoolFilterIds(supabase, params);
  if (schoolIds !== null && schoolIds.length === 0) {
    return { data: [], total: 0 };
  }

  let query = supabase
    .from("admissions")
    .select(ADMISSION_SELECT, { count: "exact" })
    .eq("published", true);

  if (params.year_before !== undefined && !Number.isNaN(params.year_before)) {
    query = query.lt("year", params.year_before);
  } else if (params.year !== undefined && !Number.isNaN(params.year)) {
    query = query.eq("year", params.year);
  }

  if (schoolIds !== null) {
    query = query.in("id", schoolIds);
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

  return { data: (data ?? []) as Admission[], total: count ?? 0 };
}

export async function getAdmissionById(
  id: number
): Promise<(Admission & { cross_comparisons?: CrossComparison[] }) | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("admissions")
    .select(ADMISSION_DETAIL_SELECT)
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
