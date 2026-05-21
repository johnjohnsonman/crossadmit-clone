import { createClient } from "@/lib/supabase/server";
import type {
  CrossComparison,
  CrossComparisonStat,
  University,
  UniversityDepartment,
} from "@/lib/supabase/types";

export async function getUniversities(params?: {
  country?: string;
  search?: string;
  limit?: number;
}): Promise<University[]> {
  const supabase = await createClient();
  let q = supabase
    .from("universities")
    .select("id, country, name_kr, name_en, logo, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name_kr", { ascending: true });

  if (params?.country?.trim()) {
    q = q.eq("country", params.country.trim());
  }
  if (params?.search?.trim()) {
    const s = params.search.trim().replace(/%/g, "\\%");
    q = q.or(`name_kr.ilike.%${s}%,name_en.ilike.%${s}%`);
  }
  if (params?.limit && params.limit > 0) {
    q = q.limit(params.limit);
  } else {
    q = q.limit(50);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as University[];
}

export async function getUniversityById(
  id: number
): Promise<University | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("universities")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as University | null;
}

export async function getDepartmentsByUniv(
  univId: number,
  search?: string
): Promise<UniversityDepartment[]> {
  const supabase = await createClient();
  let q = supabase
    .from("university_departments")
    .select("*")
    .eq("univ_id", univId)
    .eq("is_active", true)
    .order("dept_name", { ascending: true });

  if (search?.trim()) {
    const s = search.trim().replace(/%/g, "\\%");
    q = q.ilike("dept_name", `%${s}%`);
  }

  const { data, error } = await q.limit(80);
  if (error) throw new Error(error.message);
  return (data ?? []) as UniversityDepartment[];
}

export async function getCrossComparisons(params?: {
  univ_id?: number;
  limit?: number;
}): Promise<CrossComparison[]> {
  const supabase = await createClient();
  let q = supabase
    .from("cross_comparisons")
    .select("*")
    .eq("is_active", true);

  if (params?.univ_id) {
    q = q.or(
      `univ_id_win.eq.${params.univ_id},univ_id_lose.eq.${params.univ_id}`
    );
  }

  q = q.limit(params?.limit ?? 200);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as CrossComparison[];
}

/** univ_id_win / univ_id_lose 쌍별 집계 + 선택 비율 */
export async function getCrossComparisonStats(params?: {
  limit?: number;
}): Promise<CrossComparisonStat[]> {
  const rows = await getCrossComparisons({ limit: 5000 });
  const map = new Map<
    string,
    CrossComparisonStat & { _win: number }
  >();

  for (const r of rows) {
    const dw = r.dept_id_win ?? 0;
    const dl = r.dept_id_lose ?? 0;
    const key = `${r.univ_id_win}:${r.univ_id_lose}:${dw}:${dl}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      existing._win += 1;
    } else {
      map.set(key, {
        univ_id_win: r.univ_id_win,
        univ_id_lose: r.univ_id_lose,
        univ_name_win: r.univ_name_win,
        univ_name_lose: r.univ_name_lose,
        dept_name_win: r.dept_name_win,
        dept_name_lose: r.dept_name_lose,
        dept_id_win: dw,
        dept_id_lose: dl,
        count: 1,
        percentage_win: 0,
        _win: 1,
      });
    }
  }

  const stats: CrossComparisonStat[] = [];
  for (const v of map.values()) {
    const pct = Math.round((v._win / v.count) * 100);
    stats.push({
      univ_id_win: v.univ_id_win,
      univ_id_lose: v.univ_id_lose,
      univ_name_win: v.univ_name_win,
      univ_name_lose: v.univ_name_lose,
      dept_name_win: v.dept_name_win,
      dept_name_lose: v.dept_name_lose,
      dept_id_win: v.dept_id_win,
      dept_id_lose: v.dept_id_lose,
      count: v.count,
      percentage_win: pct,
    });
  }

  stats.sort((a, b) => b.count - a.count);
  return stats.slice(0, params?.limit ?? 50);
}
