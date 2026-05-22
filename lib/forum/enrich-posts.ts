import {
  loadAllUniversities,
  type UniversityRow,
} from "@/lib/pipeline/study-korea/university-id";
import { normalizeUniversitySlug } from "@/lib/pipeline/study-korea/university-map";
import { SLUG_NAME_HINTS } from "@/lib/forum/constants";

export type StudyKoreaPostRow = {
  id: string;
  university?: string | null;
  university_id?: number | null;
  [key: string]: unknown;
};

export type EnrichedPost = StudyKoreaPostRow & {
  university_name_kr: string;
  university_name_en: string;
  university_logo: string;
  university_matched_id: number | null;
};

function matchUniversityByText(
  text: string,
  unis: UniversityRow[]
): UniversityRow | null {
  const t = text.trim().toLowerCase();
  if (!t) return null;

  const slug = normalizeUniversitySlug(t, t);
  if (slug) {
    for (const u of unis) {
      const hints = SLUG_NAME_HINTS[slug];
      if (!hints) continue;
      const kr = u.name_kr;
      const en = u.name_en.toLowerCase();
      if (
        hints.some(
          (h) => kr.includes(h) || en.includes(h.toLowerCase())
        )
      ) {
        return u;
      }
    }
  }

  let best: { u: UniversityRow; len: number } | null = null;
  for (const u of unis) {
    const kr = u.name_kr.toLowerCase();
    const en = u.name_en.toLowerCase();
    if (kr && (t.includes(kr) || kr.includes(t))) {
      const len = kr.length;
      if (!best || len > best.len) best = { u, len };
    }
    if (en && (t.includes(en) || en.includes(t))) {
      const len = en.length;
      if (!best || len > best.len) best = { u, len };
    }
  }
  return best?.u ?? null;
}

export async function enrichStudyKoreaPosts<T extends StudyKoreaPostRow>(
  posts: T[]
): Promise<Array<T & EnrichedPost>> {
  const unis = await loadAllUniversities();
  const byId = new Map(unis.map((u) => [u.id, u]));

  return posts.map((post) => {
    let matched: UniversityRow | null = null;

    if (post.university_id) {
      matched = byId.get(post.university_id as number) ?? null;
    }
    if (!matched && post.university) {
      matched = matchUniversityByText(String(post.university), unis);
    }

    const id =
      (post.university_id as number | null) ??
      matched?.id ??
      null;

    return {
      ...post,
      university_matched_id: id,
      university_name_kr: matched?.name_kr ?? "",
      university_name_en: matched?.name_en ?? "",
      university_logo: matched?.logo ?? "",
    };
  });
}
