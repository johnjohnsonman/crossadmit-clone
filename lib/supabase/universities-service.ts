import {
  escapeIlikeForPostgrest,
  safeSearchTerm,
} from "@/lib/admissions/university-search";
import { createClient } from "@/lib/supabase/server";
import type { CrossComparison, University, UniversityDepartment } from "@/lib/supabase/types";

async function loadUniversityNameMap(): Promise<
  Map<number, { name_kr: string; name_en: string }>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("universities")
    .select("id, name_kr, name_en");
  if (error) {
    console.error("loadUniversityNameMap:", error);
    return new Map();
  }
  const map = new Map<number, { name_kr: string; name_en: string }>();
  for (const u of data ?? []) {
    map.set(u.id as number, {
      name_kr: String(u.name_kr ?? ""),
      name_en: String(u.name_en ?? ""),
    });
  }
  return map;
}

function hasHangul(s: string): boolean {
  return /[\uAC00-\uD7A3]/.test(s);
}

/** 검색어 관련도 순 정렬 (영문 검색·약어 우선) */
function rankUniversitiesBySearch(
  rows: University[],
  search: string
): University[] {
  const q = search.trim().toLowerCase();
  if (!q) return rows;

  const isLatinQuery = /^[a-z0-9\s.&'/-]+$/i.test(search.trim());

  const score = (u: University): number => {
    const kr = String(u.name_kr ?? "").toLowerCase();
    const en = String(u.name_en ?? "").toLowerCase();
    let s = 0;

    if (kr === q || en === q) s += 10_000;
    else if (kr.startsWith(q) || en.startsWith(q)) s += 5_000;
    else if (kr.includes(q) || en.includes(q)) s += 1_000;

    if (isLatinQuery) {
      if (en === q) s += 3_000;
      else if (en.startsWith(q)) s += 2_000;
      else if (en.includes(q)) s += 800;
      if (kr === q) s += 2_500;
      else if (kr.startsWith(q)) s += 1_500;
      else if (kr.includes(q)) s += 400;
      if (!hasHangul(String(u.name_kr ?? ""))) s += 300;
    }

    return s;
  };

  return [...rows].sort((a, b) => {
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return String(a.name_kr ?? "").localeCompare(String(b.name_kr ?? ""), "ko");
  });
}

export function formatUniversityAutocompleteLabel(u: {
  name_kr: string;
  name_en?: string | null;
}): string {
  const kr = String(u.name_kr ?? "").trim();
  const en = String(u.name_en ?? "").trim();
  if (!kr) return en;
  if (!en || kr === en) return kr;
  if (hasHangul(kr)) return kr;
  return `${kr} (${en})`;
}

function resolveUnivDisplayName(
  id: number,
  fallback: string,
  names: Map<number, { name_kr: string; name_en: string }>,
  locale?: "ko" | "en"
): string {
  const row = names.get(id);
  if (!row) return fallback;
  if (locale === "en" && row.name_en.trim()) return row.name_en.trim();
  return row.name_kr.trim() || fallback;
}

export async function getUniversities(params?: {
  country?: string;
  search?: string;
  limit?: number;
  locale?: "ko" | "en";
}): Promise<University[]> {
  const supabase = await createClient();
  const orderCol = params?.locale === "en" ? "name_en" : "name_kr";
  let query = supabase
    .from("universities")
    .select("*")
    .eq("is_active", true)
    .order(orderCol, { ascending: true });

  if (params?.country?.trim()) {
    query = query.eq("country", params.country.trim());
  }

  const searchRaw = params?.search?.trim() ?? "";
  if (searchRaw) {
    const safe = escapeIlikeForPostgrest(searchRaw);
    if (!safe) return [];
    query = query.or(`name_kr.ilike.%${safe}%,name_en.ilike.%${safe}%`);
  }

  const lim = params?.limit ?? 50;
  query = query.limit(lim);

  const { data, error } = await query;
  if (error) {
    console.error("getUniversities:", error);
    throw new Error(error.message);
  }
  const rows = (data ?? []) as University[];
  if (searchRaw) {
    return rankUniversitiesBySearch(rows, safeSearchTerm(searchRaw) || searchRaw);
  }
  return rows;
}

/** intl_url이 채워진 대학 (유학가이드 카드용) */
export async function getUniversitiesWithIntlUrl(): Promise<University[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("universities")
    .select("*")
    .eq("is_active", true)
    .not("intl_url", "is", null)
    .neq("intl_url", "")
    .order("name_kr", { ascending: true });

  if (error) {
    console.error("getUniversitiesWithIntlUrl:", error);
    throw new Error(error.message);
  }
  return (data ?? []) as University[];
}

export async function getUniversityById(id: number): Promise<University | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("universities")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getUniversityById:", error);
    throw new Error(error.message);
  }
  return data as University | null;
}

export async function getUniversityDepartments(
  univId: number,
  search?: string
): Promise<UniversityDepartment[]> {
  const supabase = await createClient();
  let query = supabase
    .from("university_departments")
    .select("*")
    .eq("univ_id", univId)
    .order("dept_name", { ascending: true });

  if (search?.trim()) {
    const safe = escapeIlikeForPostgrest(search.trim());
    if (safe) {
      query = query.or(`dept_name.ilike.%${safe}%,dept_name_en.ilike.%${safe}%`);
    }
  }

  const { data, error } = await query.limit(80);
  if (error) {
    console.error("getUniversityDepartments:", error);
    throw new Error(error.message);
  }
  return (data ?? []) as UniversityDepartment[];
}

export async function getCrossComparisons(params?: {
  univ_id?: number;
  univ_a?: number;
  univ_b?: number;
  limit?: number;
}): Promise<CrossComparison[]> {
  const supabase = await createClient();
  let query = supabase.from("cross_comparisons").select("*");

  if (params?.univ_a !== undefined && params?.univ_b !== undefined) {
    const a = params.univ_a;
    const b = params.univ_b;
    query = query.or(
      `and(univ_id_win.eq.${a},univ_id_lose.eq.${b}),and(univ_id_win.eq.${b},univ_id_lose.eq.${a})`
    );
  } else if (params?.univ_id !== undefined) {
    const uid = params.univ_id;
    query = query.or(`univ_id_win.eq.${uid},univ_id_lose.eq.${uid}`);
  }

  query = query.order("id", { ascending: false });
  query = query.limit(params?.limit ?? 200);

  const { data, error } = await query;
  if (error) {
    console.error("getCrossComparisons:", error);
    throw new Error(error.message);
  }
  return (data ?? []) as CrossComparison[];
}

export type CrossComparisonStat = {
  univ_id_win: number;
  univ_id_lose: number;
  univ_name_win: string;
  univ_name_lose: string;
  dept_name_win: string;
  dept_name_lose: string;
  count: number;
  percentage_win: number;
  percentage_lose: number;
  id: string;
  latest_id: number;
};

export type CrossComparisonSort = "latest" | "popular" | "random";

function shuffleStats<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type SchoolRow = {
  admission_id: number;
  univ_id: number;
  univ_name: string;
  dept_name: string;
  is_regist: boolean;
};

/** admission_schools 기반 실시간 크로스어드밋 집계 */
async function getCrossComparisonStatsFromSchools(params?: {
  univ_a?: number;
  univ_b?: number;
  locale?: "ko" | "en";
}): Promise<CrossComparisonStat[]> {
  const supabase = await createClient();
  const nameMap = await loadUniversityNameMap();
  const locale = params?.locale;

  const { data: published, error: pubErr } = await supabase
    .from("admissions")
    .select("id")
    .eq("published", true);
  if (pubErr) {
    console.error("getCrossComparisonStatsFromSchools admissions:", pubErr);
    return [];
  }
  const pubIds = (published ?? []).map((a) => a.id as number);
  if (pubIds.length === 0) return [];

  const { data: schoolRows, error: schErr } = await supabase
    .from("admission_schools")
    .select("admission_id, univ_id, univ_name, dept_name, is_accept, is_regist")
    .in("admission_id", pubIds)
    .eq("is_accept", true);
  if (schErr) {
    console.error("getCrossComparisonStatsFromSchools schools:", schErr);
    return [];
  }

  const byAdmission = new Map<number, SchoolRow[]>();
  for (const raw of schoolRows ?? []) {
    const row = raw as SchoolRow;
    const list = byAdmission.get(row.admission_id) ?? [];
    list.push(row);
    byAdmission.set(row.admission_id, list);
  }

  type PairAgg = {
    lowId: number;
    highId: number;
    nameLow: string;
    nameHigh: string;
    forward: number;
    reverse: number;
    pairTotal: number;
    latestId: number;
  };

  const map = new Map<string, PairAgg>();

  for (const [admissionId, schools] of byAdmission) {
    if (schools.length < 2) continue;

    for (let i = 0; i < schools.length; i++) {
      for (let j = i + 1; j < schools.length; j++) {
        const a = schools[i];
        const b = schools[j];
        const lowId = Math.min(a.univ_id, b.univ_id);
        const highId = Math.max(a.univ_id, b.univ_id);
        if (!lowId || !highId || lowId === highId) continue;

        const key = `${lowId}:${highId}`;
        let agg = map.get(key);
        if (!agg) {
          agg = {
            lowId,
            highId,
            nameLow: a.univ_id === lowId ? a.univ_name : b.univ_name,
            nameHigh: a.univ_id === highId ? a.univ_name : b.univ_name,
            forward: 0,
            reverse: 0,
            pairTotal: 0,
            latestId: admissionId,
          };
          map.set(key, agg);
        }
        agg.pairTotal += 1;
        agg.latestId = Math.max(agg.latestId, admissionId);

        if (a.is_regist && !b.is_regist) {
          if (a.univ_id === lowId) agg.forward += 1;
          else agg.reverse += 1;
        } else if (b.is_regist && !a.is_regist) {
          if (b.univ_id === lowId) agg.forward += 1;
          else agg.reverse += 1;
        }
      }
    }
  }

  const stats: CrossComparisonStat[] = [];
  for (const agg of map.values()) {
    const decisions = agg.forward + agg.reverse;
    if (decisions === 0) continue;

    if (
      params?.univ_a !== undefined &&
      params?.univ_b !== undefined &&
      !(
        (agg.lowId === params.univ_a && agg.highId === params.univ_b) ||
        (agg.lowId === params.univ_b && agg.highId === params.univ_a)
      )
    ) {
      continue;
    }

    const pctWin = Math.round((agg.forward / decisions) * 100);
    stats.push({
      id: `cross-${agg.lowId}-vs-${agg.highId}`,
      univ_id_win: agg.lowId,
      univ_id_lose: agg.highId,
      univ_name_win: resolveUnivDisplayName(
        agg.lowId,
        agg.nameLow,
        nameMap,
        locale
      ),
      univ_name_lose: resolveUnivDisplayName(
        agg.highId,
        agg.nameHigh,
        nameMap,
        locale
      ),
      dept_name_win: "",
      dept_name_lose: "",
      count: decisions,
      percentage_win: pctWin,
      percentage_lose: 100 - pctWin,
      latest_id: agg.latestId,
    });
  }

  return stats;
}

/** 대학 쌍별 집계 (admission_schools 실시간 계산) */
export async function getCrossComparisonStats(params?: {
  univ_a?: number;
  univ_b?: number;
  sort?: CrossComparisonSort;
  locale?: "ko" | "en";
}): Promise<CrossComparisonStat[]> {
  const stats = await getCrossComparisonStatsFromSchools({
    univ_a: params?.univ_a,
    univ_b: params?.univ_b,
    locale: params?.locale,
  });

  const sort = params?.sort ?? "latest";
  if (sort === "popular") {
    return stats.sort((a, b) => b.count - a.count);
  }
  if (sort === "random") {
    return shuffleStats(stats);
  }
  return stats.sort((a, b) => b.latest_id - a.latest_id);
}
