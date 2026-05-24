import { loadAllUniversities } from "@/lib/pipeline/study-korea/university-id";
import type { ExtractedUniversity } from "@/lib/classifiers/admission-classifier";

export type MatchedSchool = {
  name: string;
  department: string;
  result: ExtractedUniversity["result"];
  matched: boolean;
  univ_id: number | null;
};

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\uac00-\ud7a3]+/g, " ");
}

export async function matchUniversities(
  universities: ExtractedUniversity[]
): Promise<MatchedSchool[]> {
  const rows = await loadAllUniversities();
  const out: MatchedSchool[] = [];

  for (const u of universities) {
    const name = u.name.trim();
    const n = norm(name);
    let univ_id: number | null = null;

    for (const row of rows) {
      const kr = norm(row.name_kr);
      const en = norm(row.name_en);
      if (
        (kr && (n.includes(kr) || kr.includes(n))) ||
        (en && (n.includes(en) || en.includes(n)))
      ) {
        univ_id = row.id;
        break;
      }
    }

    out.push({
      name,
      department: u.department?.trim() || "General",
      result: u.result,
      matched: univ_id != null,
      univ_id,
    });
  }

  return out;
}
