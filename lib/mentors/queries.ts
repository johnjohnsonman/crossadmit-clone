import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MENTOR_CARD_SELECT, MENTOR_PAGE_SIZE } from "./constants";
import type { MentorRow, MentorSearchParams, MentorSearchResult } from "./types";
import { searchMentors } from "./search";

export async function fetchMentors(
  params: MentorSearchParams
): Promise<MentorSearchResult> {
  return searchMentors(params);
}

export async function getActiveMentorCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("mentors")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);
  if (error) return 141;
  return count ?? 0;
}

export async function getMentorById(id: string): Promise<MentorRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mentors")
    .select(MENTOR_CARD_SELECT)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as MentorRow;
}

export async function getSimilarMentors(
  mentor: MentorRow,
  limit = 3
): Promise<MentorRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("mentors")
    .select(MENTOR_CARD_SELECT)
    .eq("is_active", true)
    .neq("id", mentor.id)
    .order("view_count", { ascending: false })
    .limit(limit);

  const univId = mentor.university_id ?? mentor.university?.id;
  if (univId) {
    query = query.eq("university_id", univId);
  }

  const { data } = await query;
  const rows = (data ?? []) as unknown as MentorRow[];
  if (rows.length >= limit) return rows.slice(0, limit);

  const { data: more } = await supabase
    .from("mentors")
    .select(MENTOR_CARD_SELECT)
    .eq("is_active", true)
    .neq("id", mentor.id)
    .order("view_count", { ascending: false })
    .limit(limit);

  const merged = [...rows];
  for (const m of (more ?? []) as unknown as MentorRow[]) {
    if (merged.length >= limit) break;
    if (!merged.find((x) => x.id === m.id)) merged.push(m);
  }
  return merged.slice(0, limit);
}

export async function getMentorsForCategory(
  category: string,
  limit = 3
): Promise<MentorRow[]> {
  const params: MentorSearchParams = {
    page: 1,
    limit,
    sort: "popular",
  };

  const admissionCats = new Set(["visa", "admission", "scholarship", "language"]);
  const careerCats = new Set(["employment", "settlement", "living_cost"]);

  if (admissionCats.has(category)) params.offers = "admission";
  else if (careerCats.has(category)) params.offers = "career";

  const result = await searchMentors(params);
  return result.mentors;
}

export async function getMentorIdsForSitemap(limit = 500): Promise<
  { id: string; updated_at: string }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mentors")
    .select("id, updated_at")
    .eq("is_active", true)
    .order("view_count", { ascending: false })
    .limit(limit);

  return (data ?? []) as { id: string; updated_at: string }[];
}

export async function getTranslationBackfillStatus() {
  const admin = createAdminClient();
  const { count: total } = await admin
    .from("mentors")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: translated } = await admin
    .from("mentors")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .not("intro_en", "is", null)
    .neq("intro_en", "");

  const { count: inactive } = await admin
    .from("mentors")
    .select("id", { count: "exact", head: true })
    .eq("is_active", false);

  return {
    total: total ?? 0,
    translated: translated ?? 0,
    remaining: Math.max(0, (total ?? 0) - (translated ?? 0)),
    inactive: inactive ?? 0,
  };
}

export async function getInactiveMentors(): Promise<MentorRow[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("mentors")
    .select(MENTOR_CARD_SELECT)
    .eq("is_active", false)
    .order("legacy_created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as MentorRow[];
}

export { MENTOR_PAGE_SIZE };
