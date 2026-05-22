import { createClient } from "@supabase/supabase-js";
import { SLUG_NAME_HINTS } from "@/lib/forum/constants";

let cache: Map<string, number> | null = null;

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

async function loadCache(): Promise<Map<string, number>> {
  if (cache) return cache;
  const map = new Map<string, number>();
  const supabase = admin();
  if (!supabase) return map;

  const { data } = await supabase
    .from("universities")
    .select("id, name_kr, name_en")
    .eq("is_active", true);

  for (const u of data ?? []) {
    const id = u.id as number;
    const kr = String(u.name_kr ?? "");
    const en = String(u.name_en ?? "");
    for (const [slug, hints] of Object.entries(SLUG_NAME_HINTS)) {
      if (map.has(slug)) continue;
      if (
        hints.some(
          (h) =>
            kr.includes(h) ||
            en.toLowerCase().includes(h.toLowerCase())
        )
      ) {
        map.set(slug, id);
      }
    }
  }
  cache = map;
  return map;
}

export async function resolveUniversityId(
  slug: string | null | undefined
): Promise<number | null> {
  if (!slug || slug === "other") return null;
  const map = await loadCache();
  return map.get(slug) ?? null;
}
