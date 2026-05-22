import { createClient } from "@supabase/supabase-js";
import { SLUG_NAME_HINTS } from "@/lib/forum/constants";
import { normalizeUniversitySlug } from "./university-map";

export type UniversityRow = {
  id: number;
  name_kr: string;
  name_en: string;
  logo?: string;
};

let slugCache: Map<string, number> | null = null;
let allUniversities: UniversityRow[] | null = null;

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function escapeIlike(raw: string): string {
  return raw.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export async function loadAllUniversities(): Promise<UniversityRow[]> {
  if (allUniversities) return allUniversities;
  const supabase = admin();
  if (!supabase) return [];

  const { data } = await supabase
    .from("universities")
    .select("id, name_kr, name_en, logo")
    .eq("is_active", true);

  allUniversities = (data ?? []).map((u) => ({
    id: u.id as number,
    name_kr: String(u.name_kr ?? ""),
    name_en: String(u.name_en ?? ""),
    logo: String(u.logo ?? ""),
  }));
  return allUniversities;
}

async function loadSlugCache(): Promise<Map<string, number>> {
  if (slugCache) return slugCache;
  const map = new Map<string, number>();
  const unis = await loadAllUniversities();

  for (const u of unis) {
    const kr = u.name_kr;
    const en = u.name_en;
    for (const [slug, hints] of Object.entries(SLUG_NAME_HINTS)) {
      if (map.has(slug)) continue;
      if (
        hints.some(
          (h) =>
            kr.includes(h) ||
            en.toLowerCase().includes(h.toLowerCase())
        )
      ) {
        map.set(slug, u.id);
      }
    }
  }
  slugCache = map;
  return map;
}

export async function resolveUniversityId(
  slug: string | null | undefined
): Promise<number | null> {
  if (!slug || slug === "other") return null;
  const map = await loadSlugCache();
  return map.get(slug) ?? null;
}

function slugForUniversity(u: UniversityRow): string {
  const text = `${u.name_kr} ${u.name_en}`;
  return normalizeUniversitySlug("", text) || "";
}

function scoreUniversityMatch(
  u: UniversityRow,
  searchText: string
): number {
  const t = searchText.toLowerCase();
  const kr = u.name_kr.toLowerCase();
  const en = u.name_en.toLowerCase();
  if (!t) return 0;
  if (kr === t || en === t) return 100;
  if (kr.includes(t) || t.includes(kr)) return 80;
  if (en.includes(t) || t.includes(en)) return 75;
  for (const hints of Object.values(SLUG_NAME_HINTS)) {
    if (hints.some((h) => t.includes(h.toLowerCase()) && (kr.includes(h) || en.toLowerCase().includes(h.toLowerCase())))) {
      return 60;
    }
  }
  return 0;
}

/**
 * slug 또는 Claude 추출 텍스트로 universities.id 매칭
 */
export async function resolveUniversityMatch(
  slugOrText: string,
  extraText = ""
): Promise<{
  id: number | null;
  slug: string;
  name_kr: string;
  name_en: string;
}> {
  const combined = `${slugOrText} ${extraText}`.trim();
  if (!combined) {
    return { id: null, slug: "", name_kr: "", name_en: "" };
  }

  const slugFromText = normalizeUniversitySlug(slugOrText, combined);
  if (slugFromText) {
    const id = await resolveUniversityId(slugFromText);
    if (id) {
      const unis = await loadAllUniversities();
      const row = unis.find((u) => u.id === id);
      if (row) {
        return {
          id,
          slug: slugFromText,
          name_kr: row.name_kr,
          name_en: row.name_en,
        };
      }
    }
  }

  const unis = await loadAllUniversities();
  let best: { u: UniversityRow; score: number } | null = null;
  for (const u of unis) {
    const score = scoreUniversityMatch(u, combined);
    if (score > 0 && (!best || score > best.score)) {
      best = { u, score };
    }
  }
  if (best && best.score >= 60) {
    return {
      id: best.u.id,
      slug: slugForUniversity(best.u) || slugFromText,
      name_kr: best.u.name_kr,
      name_en: best.u.name_en,
    };
  }

  const supabase = admin();
  if (supabase) {
    const needle = escapeIlike(combined.slice(0, 40));
    const { data } = await supabase
      .from("universities")
      .select("id, name_kr, name_en")
      .eq("is_active", true)
      .or(`name_kr.ilike.%${needle}%,name_en.ilike.%${needle}%`)
      .limit(1)
      .maybeSingle();

    if (data) {
      const row = data as UniversityRow;
      return {
        id: row.id,
        slug: slugForUniversity(row) || slugFromText,
        name_kr: row.name_kr,
        name_en: row.name_en,
      };
    }
  }

  return {
    id: null,
    slug: slugFromText || slugOrText.slice(0, 80),
    name_kr: "",
    name_en: "",
  };
}

export function clearUniversityCache() {
  slugCache = null;
  allUniversities = null;
}
