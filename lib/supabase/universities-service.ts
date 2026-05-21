import { createClient } from "@/lib/supabase/server";
import type { CrossComparison, University, UniversityDepartment } from "@/lib/supabase/types";

function escapeIlike(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function getUniversities(params?: {
  country?: string;
  search?: string;
  limit?: number;
}): Promise<University[]> {
  const supabase = await createClient();
  let query = supabase
    .from("universities")
    .select("*")
    .eq("is_active", true)
    .order("name_kr", { ascending: true });

  if (params?.country?.trim()) {
    query = query.eq("country", params.country.trim());
  }

  if (params?.search?.trim()) {
    const safe = escapeIlike(params.search.trim());
    query = query.or(
      `name_kr.ilike.%${safe}%,name_en.ilike.%${safe}%`
    );
  }

  const lim = params?.limit ?? 50;
  query = query.limit(lim);

  const { data, error } = await query;
  if (error) {
    console.error("getUniversities:", error);
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
    const safe = escapeIlike(search.trim());
    query = query.or(
      `dept_name.ilike.%${safe}%,dept_name_en.ilike.%${safe}%`
    );
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
  limit?: number;
}): Promise<CrossComparison[]> {
  const supabase = await createClient();
  let query = supabase.from("cross_comparisons").select("*");

  if (params?.univ_id !== undefined) {
    const uid = params.univ_id;
    query = query.or(`univ_id_win.eq.${uid},univ_id_lose.eq.${uid}`);
  }

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
};

/** 대학 쌍별 집계 (win 방향 건수 + 역방향 건수 → 비율) */
export async function getCrossComparisonStats(): Promise<CrossComparisonStat[]> {
  const rows = await getCrossComparisons({ limit: 5000 });

  type PairAgg = {
    lowId: number;
    highId: number;
    nameLow: string;
    nameHigh: string;
    forward: number;
    reverse: number;
  };

  const map = new Map<string, PairAgg>();

  for (const r of rows) {
    const a = r.univ_id_win;
    const b = r.univ_id_lose;
    const low = Math.min(a, b);
    const high = Math.max(a, b);
    const key = `${low}:${high}`;
    let agg = map.get(key);
    if (!agg) {
      agg = {
        lowId: low,
        highId: high,
        nameLow: a < b ? r.univ_name_win : r.univ_name_lose,
        nameHigh: a < b ? r.univ_name_lose : r.univ_name_win,
        forward: 0,
        reverse: 0,
      };
      map.set(key, agg);
    }
    if (r.univ_id_win === low) {
      agg.forward += 1;
    } else {
      agg.reverse += 1;
    }
  }

  const stats: CrossComparisonStat[] = [];
  for (const agg of map.values()) {
    const total = agg.forward + agg.reverse;
    if (total === 0) continue;
    const pctWin = Math.round((agg.forward / total) * 100);
    stats.push({
      id: `cross-${agg.lowId}-vs-${agg.highId}`,
      univ_id_win: agg.lowId,
      univ_id_lose: agg.highId,
      univ_name_win: agg.nameLow,
      univ_name_lose: agg.nameHigh,
      dept_name_win: "",
      dept_name_lose: "",
      count: total,
      percentage_win: pctWin,
      percentage_lose: 100 - pctWin,
    });
  }

  return stats.sort((a, b) => b.count - a.count);
}
