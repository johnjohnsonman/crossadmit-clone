import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Admission,
  AdmissionSchool,
  CrossComparison,
} from "@/lib/supabase/types";

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

async function attachSchools(
  admissions: Admission[]
): Promise<Admission[]> {
  if (admissions.length === 0) return [];
  const ids = admissions.map((a) => a.id);
  const supabase = await createClient();
  const { data: schools, error } = await supabase
    .from("admission_schools")
    .select("*")
    .in("admission_id", ids)
    .eq("is_active", true)
    .order("is_regist", { ascending: false });

  if (error) {
    console.error("attachSchools:", error);
    return admissions;
  }

  const byAdmission = new Map<number, AdmissionSchool[]>();
  for (const s of (schools ?? []) as AdmissionSchool[]) {
    const list = byAdmission.get(s.admission_id) ?? [];
    list.push(s);
    byAdmission.set(s.admission_id, list);
  }

  return admissions.map((a) => ({
    ...a,
    admission_schools: byAdmission.get(a.id) ?? [],
  }));
}

export async function getAdmissions(
  params: GetAdmissionsParams
): Promise<{ data: Admission[]; total: number }> {
  const supabase = await createClient();
  let query = supabase.from("admissions").select("*", { count: "exact" });
  query = query.eq("published", true);

  if (params.year !== undefined && !Number.isNaN(params.year)) {
    query = query.eq("year", params.year);
  }

  if (params.search?.trim()) {
    const safe = escapeIlike(params.search.trim());
    query = query.or(
      `title.ilike.%${safe}%,user_handle.ilike.%${safe}%,input_specialty.ilike.%${safe}%`
    );
  }

  query = query.order("is_featured", { ascending: false });
  const sort = params.sort ?? "latest";
  if (sort === "likes" || sort === "popular") {
    query = query.order("likes_count", { ascending: false });
  }
  query = query.order("created_at", { ascending: false });

  const from = params.offset ?? 0;
  const lim = params.limit;
  if (lim !== undefined && lim > 0) {
    query = query.range(from, from + lim - 1);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  let rows = (data ?? []) as Admission[];

  if (params.admission_type?.trim()) {
    const typeNeedle = params.admission_type.trim();
    const withSchools = await attachSchools(rows);
    rows = withSchools.filter((a) =>
      (a.admission_schools ?? []).some(
        (s) =>
          s.admission_type.includes(typeNeedle) ||
          s.admission_type === typeNeedle
      )
    );
  } else {
    rows = await attachSchools(rows);
  }

  return { data: rows, total: count ?? rows.length };
}

export async function getAdmissionById(
  id: number
): Promise<Admission | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admissions")
    .select("*")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const admission = data as Admission;

  const { data: schools } = await supabase
    .from("admission_schools")
    .select("*")
    .eq("admission_id", id)
    .eq("is_active", true);

  const { data: crosses } = await supabase
    .from("cross_comparisons")
    .select("*")
    .eq("admission_id", id)
    .eq("is_active", true);

  return {
    ...admission,
    admission_schools: (schools ?? []) as AdmissionSchool[],
    cross_comparisons: (crosses ?? []) as CrossComparison[],
  };
}

export async function getAdmissionsCount(
  params: Omit<GetAdmissionsParams, "limit" | "offset" | "sort">
): Promise<number> {
  const { total } = await getAdmissions({ ...params, limit: 1, offset: 0 });
  return total;
}

export async function getRecentRegistrations(
  limit = 20
): Promise<AdmissionSchool[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admission_schools")
    .select("*")
    .eq("is_regist", true)
    .eq("is_active", true)
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error("getRecentRegistrations:", error);
    return [];
  }
  return (data ?? []) as AdmissionSchool[];
}

export async function incrementAdmissionLike(
  id: number
): Promise<number | null> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("admissions")
    .select("likes_count")
    .eq("id", id)
    .eq("published", true)
    .maybeSingle();

  if (!row) return null;
  const next = (row.likes_count ?? 0) + 1;
  const { error } = await admin
    .from("admissions")
    .update({ likes_count: next })
    .eq("id", id);
  if (error) throw new Error(error.message);
  return next;
}

export function buildCrossComparisonsFromSchools(
  admissionId: number,
  schools: Array<{
    univ_id: number
    dept_id: number
    univ_name: string
    dept_name: string
    is_accept: boolean
    is_regist: boolean
  }>
): Omit<CrossComparison, "id" | "count">[] {
  const registered = schools.filter((s) => s.is_regist);
  const acceptedNotReg = schools.filter((s) => s.is_accept && !s.is_regist);
  const rows: Omit<CrossComparison, "id" | "count">[] = [];

  for (const win of registered) {
    for (const lose of acceptedNotReg) {
      if (win.univ_id === lose.univ_id && win.dept_id === lose.dept_id) continue;
      rows.push({
        admission_id: admissionId,
        univ_id_win: win.univ_id,
        univ_id_lose: lose.univ_id,
        univ_name_win: win.univ_name,
        univ_name_lose: lose.univ_name,
        dept_name_win: win.dept_name,
        dept_name_lose: lose.dept_name,
        dept_id_win: win.dept_id,
        dept_id_lose: lose.dept_id,
      });
    }
  }
  return rows;
}
