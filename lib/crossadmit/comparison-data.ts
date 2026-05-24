import {
  buildComparisonSlug,
  displayUniversityName,
  formatSchoolKeyLabel,
} from "@/lib/crossadmit/comparison-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  getCrossComparisonStats,
  getUniversityById,
  type CrossComparisonStat,
} from "@/lib/supabase/universities-service";
import type { University } from "@/lib/supabase/types";

export type UnivAdmissionStats = {
  acceptCount: number;
  registCount: number;
  avgScoreLabel: string | null;
};

export type CompareUniversityCard = {
  id: number;
  name: string;
  nameKr: string;
  nameEn: string;
  country: string;
  locationLabel: string;
  stats: UnivAdmissionStats;
  admissionsUrl: string;
};

export type ComparePairResult = {
  slug: string;
  totalDecisions: number;
  choseA: number;
  choseB: number;
  percentageA: number;
  percentageB: number;
  latestAt: string | null;
  hasData: boolean;
};

export type SimilarUniversityChip = {
  id: number;
  name: string;
  comparisonSlug: string | null;
};

export type CrossComparePayload = {
  locale: "ko" | "en";
  universityA: CompareUniversityCard;
  universityB: CompareUniversityCard;
  comparison: ComparePairResult;
  similarA: SimilarUniversityChip[];
  similarB: SimilarUniversityChip[];
};

async function loadAdmissionStatsForUniv(
  univId: number
): Promise<UnivAdmissionStats> {
  const admin = createAdminClient();

  const { count: acceptCount, error: e1 } = await admin
    .from("admission_schools")
    .select("*", { count: "exact", head: true })
    .eq("univ_id", univId)
    .eq("is_accept", true);

  const { count: registCount, error: e2 } = await admin
    .from("admission_schools")
    .select("*", { count: "exact", head: true })
    .eq("univ_id", univId)
    .eq("is_regist", true);

  if (e1 || e2) {
    console.error("loadAdmissionStatsForUniv:", e1 ?? e2);
  }

  const { data: scoreRows } = await admin
    .from("admission_schools")
    .select("admission_id")
    .eq("univ_id", univId)
    .eq("is_accept", true)
    .limit(200);

  const admissionIds = [
    ...new Set((scoreRows ?? []).map((r) => r.admission_id as number)),
  ];

  let avgScoreLabel: string | null = null;
  if (admissionIds.length > 0) {
    const { data: admissions } = await admin
      .from("admissions")
      .select("input_score, input_gpa")
      .in("id", admissionIds.slice(0, 100))
      .eq("published", true);

    const scores: string[] = [];
    for (const a of admissions ?? []) {
      const s = String(a.input_score ?? "").trim();
      const g = String(a.input_gpa ?? "").trim();
      if (s) scores.push(s);
      else if (g) scores.push(g);
    }
    if (scores.length > 0) {
      avgScoreLabel = scores.slice(0, 3).join(" · ");
      if (scores.length > 3) avgScoreLabel += " …";
    }
  }

  return {
    acceptCount: acceptCount ?? 0,
    registCount: registCount ?? 0,
    avgScoreLabel,
  };
}

function toCompareCard(
  u: University,
  locale: "ko" | "en"
): CompareUniversityCard {
  const name = displayUniversityName(u, locale);
  const country = String(u.country ?? "").trim();
  return {
    id: u.id,
    name,
    nameKr: u.name_kr,
    nameEn: u.name_en,
    country,
    locationLabel: country || "—",
    stats: { acceptCount: 0, registCount: 0, avgScoreLabel: null },
    admissionsUrl: `/admissions?univ_id=${u.id}`,
  };
}

function mapStatToPair(
  stat: CrossComparisonStat | undefined,
  lowId: number,
  highId: number
): ComparePairResult {
  const slug = buildComparisonSlug(lowId, highId);
  if (!stat || stat.count <= 0) {
    return {
      slug,
      totalDecisions: 0,
      choseA: 0,
      choseB: 0,
      percentageA: 0,
      percentageB: 0,
      latestAt: null,
      hasData: false,
    };
  }

  const pctLow = stat.percentage_win;
  const pctHigh = stat.percentage_lose;
  const choseLow = Math.round((stat.count * pctLow) / 100);
  const choseHigh = stat.count - choseLow;

  return {
    slug,
    totalDecisions: stat.count,
    choseA: choseLow,
    choseB: choseHigh,
    percentageA: pctLow,
    percentageB: pctHigh,
    latestAt: stat.latest_at ?? null,
    hasData: true,
  };
}

async function loadSimilarUniversities(
  selfId: number,
  otherId: number,
  locale: "ko" | "en",
  limit = 4
): Promise<SimilarUniversityChip[]> {
  const self = await getUniversityById(selfId);
  if (!self) return [];

  const supabase = await createClient();
  let query = supabase
    .from("universities")
    .select("id, name_kr, name_en, country")
    .eq("is_active", true)
    .neq("id", selfId)
    .neq("id", otherId);

  if (self.country?.trim()) {
    query = query.eq("country", self.country.trim());
  }

  const { data, error } = await query.limit(24);
  if (error) {
    console.error("loadSimilarUniversities:", error);
    return [];
  }

  const stats = await getCrossComparisonStats({ sort: "popular", locale });
  const popularIds = new Set<number>();
  for (const s of stats) {
    if (s.univ_id_win > 0) popularIds.add(s.univ_id_win);
    if (s.univ_id_lose > 0) popularIds.add(s.univ_id_lose);
  }

  const rows = (data ?? []) as University[];
  const ranked = [...rows].sort((a, b) => {
    const aPop = popularIds.has(a.id) ? 1 : 0;
    const bPop = popularIds.has(b.id) ? 1 : 0;
    if (bPop !== aPop) return bPop - aPop;
    return displayUniversityName(a, locale).localeCompare(
      displayUniversityName(b, locale),
      locale === "en" ? "en" : "ko"
    );
  });

  return ranked.slice(0, limit).map((u) => ({
    id: u.id,
    name: displayUniversityName(u, locale),
    comparisonSlug: buildComparisonSlug(selfId, u.id),
  }));
}

export async function buildCrossComparePayload(
  univAId: number,
  univBId: number,
  locale: "ko" | "en" = "ko"
): Promise<CrossComparePayload | null> {
  const [low, high] =
    univAId < univBId ? [univAId, univBId] : [univBId, univAId];

  const [rowA, rowB] = await Promise.all([
    getUniversityById(univAId),
    getUniversityById(univBId),
  ]);

  if (!rowA || !rowB) return null;

  const [statsLeft, statsRight, statRows] = await Promise.all([
    loadAdmissionStatsForUniv(univAId),
    loadAdmissionStatsForUniv(univBId),
    getCrossComparisonStats({
      univ_a: low,
      univ_b: high,
      sort: "latest",
      locale,
    }),
  ]);

  const cardA = toCompareCard(rowA, locale);
  const cardB = toCompareCard(rowB, locale);
  cardA.stats = statsLeft;
  cardB.stats = statsRight;

  const rawPair = mapStatToPair(statRows[0], low, high);
  const comparison =
    univAId === low
      ? rawPair
      : {
          ...rawPair,
          choseA: rawPair.choseB,
          choseB: rawPair.choseA,
          percentageA: rawPair.percentageB,
          percentageB: rawPair.percentageA,
        };

  const [similarA, similarB] = await Promise.all([
    loadSimilarUniversities(univAId, univBId, locale),
    loadSimilarUniversities(univBId, univAId, locale),
  ]);

  return {
    locale,
    universityA: cardA,
    universityB: cardB,
    comparison,
    similarA,
    similarB,
  };
}
