import { createClient } from "@/lib/supabase/server";
import type { AdmissionsRow } from "@/lib/supabase/types";

export type AdmissionsSort = "latest" | "popular";

export interface GetAdmissionsParams {
  university?: string;
  year?: number;
  admission_type?: string;
  status?: string;
  limit?: number;
  offset?: number;
  sort?: AdmissionsSort;
  search?: string;
  /** 기존 API 호환 */
  source?: string;
  nationality?: string;
}

const KNOWN_SCHOOL_CODES = new Set([
  "snu",
  "yonsei",
  "korea",
  "kaist",
  "skku",
  "other",
]);

function escapeIlikePattern(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function isSchoolCode(u: string): boolean {
  return KNOWN_SCHOOL_CODES.has(u.toLowerCase());
}

/**
 * university:
 * - snu | yonsei | korea | kaist | skku | other → 드롭다운 필터
 * - 그 외 → 기존처럼 `university` 컬럼만 ilike (부분 검색)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyUniversityFilter(query: any, raw: string): any {
  const u = raw.trim();
  if (!u) return query;

  if (isSchoolCode(u)) {
    const code = u.toLowerCase();
    switch (code) {
      case "snu":
        return query.or(
          "university.ilike.%서울대%,university_en.ilike.%Seoul National%"
        );
      case "yonsei":
        return query.or(
          "university.ilike.%연세%,university_en.ilike.%Yonsei%"
        );
      case "korea":
        return query.or(
          "university.ilike.%고려%,university_en.ilike.%Korea University%"
        );
      case "kaist":
        return query.or(
          "university.ilike.%KAIST%,university.ilike.%카이스트%,university_en.ilike.%KAIST%"
        );
      case "skku":
        return query.or(
          "university.ilike.%성균관%,university_en.ilike.%Sungkyunkwan%"
        );
      case "other":
        return query
          .not("university", "ilike", "%서울대%")
          .not("university", "ilike", "%연세%")
          .not("university", "ilike", "%고려%")
          .not("university", "ilike", "%성균관%")
          .not("university", "ilike", "%KAIST%")
          .not("university", "ilike", "%카이스트%");
      default:
        return query;
    }
  }

  const safe = escapeIlikePattern(u);
  return query.ilike("university", `%${safe}%`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyAdmissionTypeFilter(query: any, admissionType: string): any {
  const t = admissionType.trim();
  if (!t) return query;
  const safe = escapeIlikePattern(t);
  return query.ilike("admission_type", `%${safe}%`);
}

type FilterParams = Omit<GetAdmissionsParams, "limit" | "offset" | "sort">;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyCommonFilters(query: any, params: FilterParams): any {
  let q = query.eq("published", true);

  if (params.search?.trim()) {
    const safe = escapeIlikePattern(params.search.trim());
    q = q.or(`university.ilike.%${safe}%,university_en.ilike.%${safe}%`);
  }

  if (params.university?.trim()) {
    q = applyUniversityFilter(q, params.university.trim());
  }

  if (params.year !== undefined && !Number.isNaN(params.year)) {
    q = q.eq("year", params.year);
  }

  if (params.admission_type?.trim()) {
    q = applyAdmissionTypeFilter(q, params.admission_type.trim());
  }

  if (params.status?.trim()) {
    q = q.eq("status", params.status.trim());
  }

  if (params.source?.trim()) {
    q = q.eq("source", params.source.trim());
  }

  if (params.nationality?.trim()) {
    q = q.eq("nationality", params.nationality.trim());
  }

  return q;
}

export async function getAdmissions(
  params: GetAdmissionsParams
): Promise<{ data: AdmissionsRow[]; total: number }> {
  const supabase = await createClient();

  let query = supabase.from("admissions").select("*", { count: "exact" });
  query = applyCommonFilters(query, params);
  query = query.order("created_at", { ascending: false });

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

  return {
    data: (data ?? []) as AdmissionsRow[],
    total: count ?? 0,
  };
}

export async function getAdmissionById(
  id: string
): Promise<AdmissionsRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admissions")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();

  if (error) {
    console.error("getAdmissionById:", error);
    throw new Error(error.message);
  }

  return data as AdmissionsRow | null;
}

export async function getAdmissionsCount(
  params: FilterParams
): Promise<number> {
  const supabase = await createClient();
  let query = supabase
    .from("admissions")
    .select("*", { count: "exact", head: true });

  query = applyCommonFilters(query, params);

  const { count, error } = await query;

  if (error) {
    console.error("getAdmissionsCount:", error);
    throw new Error(error.message);
  }

  return count ?? 0;
}
