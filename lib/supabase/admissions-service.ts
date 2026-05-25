import type { AdmitTrack } from "@/lib/admissions/admit-track";
import { EN_DEFAULT_ADMIT_TRACKS } from "@/lib/admissions/admit-track";
import type { DegreeLevel } from "@/lib/admissions/degree-level";
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
  admit_track?: AdmitTrack[];
  degree_level?: DegreeLevel[];
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
  admit_track,
  degree_level,
  original_language,
  original_title,
  original_content,
  source_type,
  home_country,
  high_school_type,
  available_as_mentor,
  mentor_intro,
  created_at,
  admission_schools (*)
`;

const INTL_MENTOR_TRACKS: AdmitTrack[] = [
  "international",
  "overseas_kr",
  "gks",
];

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

  if (params.admit_track && params.admit_track.length > 0) {
    query = query.in("admit_track", params.admit_track);
  }

  if (params.degree_level && params.degree_level.length > 0) {
    query = query.in("degree_level", params.degree_level);
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

/** Featured intl stories: verified first, then latest */
export async function getFeaturedIntlStories(
  limit = 4
): Promise<Admission[]> {
  const tracks = [...EN_DEFAULT_ADMIT_TRACKS];
  const { data } = await getAdmissions({
    admit_track: tracks,
    limit: 24,
    offset: 0,
    sort: "latest",
  });

  const rows = [...(data ?? [])].sort((a, b) => {
    const va = a.is_verified ? 1 : 0;
    const vb = b.is_verified ? 1 : 0;
    if (vb !== va) return vb - va;
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  if (rows.length <= limit) return rows;

  const picked: Admission[] = [];
  const pickedIds = new Set<number>();
  const pickedSchools = new Set<string>();

  const schoolKeyOf = (row: Admission): string => {
    const regist = row.admission_schools?.find((s) => s.is_regist);
    const accept = row.admission_schools?.find((s) => s.is_accept);
    const name = (regist?.univ_name || accept?.univ_name || "").trim().toLowerCase();
    return name || `admission-${row.id}`;
  };

  const tryPick = (predicate: (r: Admission) => boolean) => {
    const preferUniqueSchool = rows.find((r) => {
      if (pickedIds.has(r.id) || !predicate(r)) return false;
      const schoolKey = schoolKeyOf(r);
      return !pickedSchools.has(schoolKey);
    });
    const chosen =
      preferUniqueSchool ??
      rows.find((r) => !pickedIds.has(r.id) && predicate(r));
    if (!chosen) return;
    picked.push(chosen);
    pickedIds.add(chosen.id);
    pickedSchools.add(schoolKeyOf(chosen));
  };

  for (const track of EN_DEFAULT_ADMIT_TRACKS) {
    if (picked.length >= limit) break;
    tryPick((r) => r.admit_track === track);
  }

  for (const row of rows) {
    if (picked.length >= limit) break;
    if (pickedIds.has(row.id)) continue;
    const schoolKey = schoolKeyOf(row);
    if (!pickedSchools.has(schoolKey)) {
      picked.push(row);
      pickedIds.add(row.id);
      pickedSchools.add(schoolKey);
    }
  }

  for (const row of rows) {
    if (picked.length >= limit) break;
    if (pickedIds.has(row.id)) continue;
    picked.push(row);
    pickedIds.add(row.id);
  }

  return picked.slice(0, limit);
}

export async function getIntlAdmissionsSummary(): Promise<{
  total: number;
  countries: string[];
}> {
  const supabase = await createClient();
  const tracks = [...EN_DEFAULT_ADMIT_TRACKS];

  const { count, error: countError } = await supabase
    .from("admissions")
    .select("id", { count: "exact", head: true })
    .eq("published", true)
    .in("admit_track", tracks);

  if (countError) {
    console.error("getIntlAdmissionsSummary count:", countError);
    throw new Error(countError.message);
  }

  const { data, error } = await supabase
    .from("admissions")
    .select("home_country")
    .eq("published", true)
    .in("admit_track", tracks)
    .limit(500);

  if (error) {
    console.error("getIntlAdmissionsSummary countries:", error);
    throw new Error(error.message);
  }

  const freq = new Map<string, number>();
  for (const row of data ?? []) {
    const c = row.home_country?.trim();
    if (!c) continue;
    freq.set(c, (freq.get(c) ?? 0) + 1);
  }

  const countries = [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([c]) => c)
    .slice(0, 6);

  return {
    total: count ?? 0,
    countries,
  };
}

/** International track mentors (admission opt-in, instant listing) */
export async function getIntlMentorAdmissions(
  limit = 48
): Promise<Admission[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admissions")
    .select(ADMISSION_SELECT)
    .eq("available_as_mentor", true)
    .eq("published", true)
    .in("admit_track", INTL_MENTOR_TRACKS)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getIntlMentorAdmissions:", error);
    throw new Error(error.message);
  }

  return (data ?? []) as Admission[];
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
