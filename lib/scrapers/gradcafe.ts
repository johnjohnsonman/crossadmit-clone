/**
 * The GradCafe — graduate (MS/PhD) admission results for Korean universities.
 * Parses Inertia `data-page` JSON embedded in survey search HTML.
 */
import { resetClassifierRunCounter } from "@/lib/classifiers/classifier-usage";
import { fetchHtml } from "@/lib/pipeline/study-korea/fetch-html";
import {
  finishPipelineRun,
  startPipelineRun,
} from "@/lib/pipeline/study-korea/runs";
import type { ScrapeRunResult } from "@/lib/pipeline/study-korea/types";
import {
  routeScrapedPost,
  scrapedPostFromRaw,
} from "@/lib/scrapers/router";
import { setActivePipelineRunId } from "@/lib/scrapers/run-context";

export const GRADCAFE_ORIGIN = "https://www.thegradcafe.com";
export const GRADCAFE_SURVEY_PATH = "/survey/index.php";

/** Broad search terms (GradCafe search); rows filtered to Korean institutions. */
export const GRADCAFE_TARGET_QUERIES = [
  "KAIST",
  "Seoul National University",
  "SNU",
  "POSTECH",
  "Pohang University of Science",
  "Pohang",
  "Yonsei",
  "Yonsei University",
  "Korea University",
  "UNIST",
  "Ulsan National Institute",
  "GIST",
  "Sungkyunkwan",
  "Sungkyunkwan University",
  "Hanyang",
  "Hanyang University",
  "Ewha",
  "Ewha Womans University",
  "Sogang University",
  "Chung-Ang University",
  "Konkuk University",
  "Kyung Hee University",
  "Dongguk University",
  "Hongik University",
  "Sookmyung Women's University",
  "Pusan National University",
  "Kyungpook National University",
  "Chonnam National University",
  "Chungnam National University",
  "Chungbuk National University",
  "Jeonbuk National University",
  "DGIST",
  "Daegu Gyeongbuk Institute of Science and Technology",
  "Sungshin Women's University",
  "Inha University",
  "Ajou University",
] as const;

const FETCH_DELAY_MS = 1000;
const PER_PAGE = 250;
const MAX_PAGES_PER_QUERY = 10;

type GradCafeRow = {
  id: number;
  school: string;
  program: string;
  level: string;
  how: string | null;
  decision: string;
  date_of_notification: string | null;
  created_at: string | null;
  notes: string | null;
  status: string | null;
  season: string | null;
  ugpa: string | null;
  greq: number | null;
  grev: number | null;
  grew: string | null;
  gres: string | null;
  added_on_label: string | null;
  decision_label: string | null;
};

type GradCafePagePayload = {
  data?: GradCafeRow[];
  meta?: {
    current_page?: number;
    last_page?: number;
    total?: number;
    per_page?: number;
  };
};

type KoreanSchoolRule = {
  test: (school: string) => boolean;
  exclude?: RegExp;
};

/** Keep only rows that refer to a Korean university (drop KAUST/Kaiser etc.). */
const KOREAN_SCHOOL_RULES: KoreanSchoolRule[] = [
  {
    test: (s) =>
      /\bKAIST\b/i.test(s) ||
      /Korea Advanced Institute of Science/i.test(s),
    exclude: /King Abdullah|KAUST|Kaiser/i,
  },
  {
    test: (s) =>
      /Seoul National University|Seoul Nat(?:ional)?(?: Univ(?:ersity)?)?|\bSNU\b/i.test(
        s
      ),
    exclude: /Kaiser/i,
  },
  {
    test: (s) =>
      /POSTECH|Pohang University of Science(?: and Technology)?|Pohang\b/i.test(
        s
      ),
  },
  { test: (s) => /Yonsei University|Yonsei\b/i.test(s) },
  {
    test: (s) => /Korea University|Korea Univ\b/i.test(s),
    exclude: /King Abdullah|Study in Korea|Honorary/i,
  },
  {
    test: (s) =>
      /\bUNIST\b/i.test(s) ||
      /Ulsan National Institute of Science/i.test(s),
  },
  {
    test: (s) =>
      /\bGIST\b/i.test(s) ||
      /Gwangju Institute of Science/i.test(s),
  },
  {
    test: (s) =>
      /Sungkyunkwan University|Sungkyunkwan\b|\bSKKU\b/i.test(s),
  },
  { test: (s) => /Hanyang University|Hanyang Univ\b|Hanyang\b/i.test(s) },
  { test: (s) => /Ewha Womans University|\bEwha\b/i.test(s) },
  { test: (s) => /Sogang University|Sogang Univ\b|Sogang\b/i.test(s) },
  {
    test: (s) =>
      /Chung[\s-]?Ang University|Chung[\s-]?Ang Univ\b|Chung[\s-]?Ang\b/i.test(
        s
      ),
  },
  { test: (s) => /Konkuk University|Konkuk Univ\b|Konkuk\b/i.test(s) },
  {
    test: (s) =>
      /Kyung Hee University|Kyung Hee Univ\b|Kyung Hee\b/i.test(s),
  },
  { test: (s) => /Dongguk University|Dongguk Univ\b|Dongguk\b/i.test(s) },
  { test: (s) => /Hongik University|Hongik Univ\b|Hongik\b/i.test(s) },
  {
    test: (s) =>
      /Sookmyung(?: Women's| Womans)? University|Sookmyung\b/i.test(s),
  },
  {
    test: (s) =>
      /Pusan National University|Busan National University|\bPNU\b/i.test(s),
    exclude: /Punjab|Pennsylvania/i,
  },
  {
    test: (s) =>
      /Kyungpook National University|Kyungpook Univ\b|Kyungpook\b/i.test(s),
  },
  {
    test: (s) =>
      /Chonnam National University|Chonnam Univ\b|Chonnam\b/i.test(s),
  },
  {
    test: (s) =>
      /Chungnam National University|Chungnam Univ\b|Chungnam\b/i.test(s),
  },
  {
    test: (s) =>
      /Chungbuk National University|Chungbuk Univ\b|Chungbuk\b/i.test(s),
  },
  {
    test: (s) =>
      /Jeonbuk National University|Jeonbuk Univ\b|Jeonbuk\b/i.test(s),
  },
  {
    test: (s) =>
      /\bDGIST\b|Daegu Gyeongbuk Institute of Science(?: and Technology)?/i.test(
        s
      ),
  },
  {
    test: (s) =>
      /Sungshin(?: Women's| Womans)? University|Sungshin\b/i.test(s),
  },
  { test: (s) => /Inha University|Inha Univ\b|Inha\b/i.test(s) },
  { test: (s) => /Ajou University|Ajou Univ\b|Ajou\b/i.test(s) },
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeDataPage(html: string): {
  results?: GradCafePagePayload;
} | null {
  const m = html.match(/data-page="([^"]+)"/);
  if (!m) return null;
  try {
    const parsed = JSON.parse(
      m[1]!.replace(/&quot;/g, '"').replace(/&amp;/g, "&")
    ) as { props?: { results?: GradCafePagePayload } };
    return parsed.props ?? null;
  } catch {
    return null;
  }
}

export function buildGradCafeSearchUrl(query: string, page = 1): string {
  const params = new URLSearchParams({
    o: "",
    pp: String(PER_PAGE),
    q: query,
    t: "a",
    page: String(page),
  });
  return `${GRADCAFE_ORIGIN}${GRADCAFE_SURVEY_PATH}?${params.toString()}`;
}

export function isKoreanGradCafeSchool(school: string): boolean {
  const s = school.trim();
  if (!s) return false;
  return KOREAN_SCHOOL_RULES.some((rule) => {
    if (rule.exclude?.test(s)) return false;
    return rule.test(s);
  });
}

export function parseGradCafeSearchPage(html: string): GradCafePagePayload {
  const props = decodeDataPage(html);
  return props?.results ?? { data: [], meta: {} };
}

function greLine(row: GradCafeRow): string[] {
  const lines: string[] = [];
  if (row.greq && row.greq > 0) lines.push(`GRE Q: ${row.greq}`);
  if (row.grev && row.grev > 0) lines.push(`GRE V: ${row.grev}`);
  if (row.grew && row.grew !== "0.00" && row.grew !== "0")
    lines.push(`GRE AW: ${row.grew}`);
  if (row.gres) lines.push(`GRE Subject: ${row.gres}`);
  return lines;
}

export function gradCafeRowToContent(row: GradCafeRow): string {
  const parts = [
    `Institution: ${row.school}`,
    `Program: ${row.program}`,
    `Degree: ${row.level}`,
    `Decision: ${row.decision}`,
    row.how ? `Notification method: ${row.how}` : null,
    row.season ? `Season: ${row.season}` : null,
    row.status ? `Applicant status: ${row.status}` : null,
    row.added_on_label ? `Date added: ${row.added_on_label}` : null,
    row.decision_label ? `Decision date: ${row.decision_label}` : null,
    row.date_of_notification
      ? `Date of notification: ${row.date_of_notification}`
      : null,
    row.ugpa && row.ugpa !== "0.00" ? `GPA: ${row.ugpa}` : null,
    ...greLine(row),
    row.notes ? `Comments: ${row.notes}` : null,
    "",
    "Graduate school admission result shared on The GradCafe (thegradcafe.com).",
  ];
  if (/accepted|admitted/i.test(row.decision)) {
    parts.unshift(
      `Accepted to ${row.school} for ${row.level} in ${row.program}.`
    );
  } else if (/interview/i.test(row.decision)) {
    parts.unshift(
      `Admitted to interview stage at ${row.school} (${row.level}, ${row.program}).`
    );
  } else if (/wait/i.test(row.decision)) {
    parts.unshift(
      `Waitlisted at ${row.school} for ${row.level} in ${row.program}.`
    );
  } else if (/reject/i.test(row.decision)) {
    parts.unshift(
      `Application result: rejected from ${row.school} (${row.level}, ${row.program}). Also sharing graduate admission outcomes.`
    );
  }
  return parts.filter(Boolean).join("\n");
}

export function gradCafeRowToTitle(row: GradCafeRow): string {
  const degree = row.level?.trim() || "Graduate";
  const program = row.program?.trim() || "Program";
  const school = row.school.trim();
  const decision = row.decision.trim();
  return `${degree} at ${school} — ${program} (${decision})`;
}

export function gradCafeRowUrl(
  row: GradCafeRow,
  searchUrl: string
): string {
  return `${searchUrl}#gradcafe-result-${row.id}`;
}

export function gradCafeSourceId(row: GradCafeRow): string {
  return `gradcafe-${row.id}`;
}

function parseSeasonYear(season: string | null): number | null {
  if (!season) return null;
  const m = season.match(/\b(20\d{2})\b/);
  return m ? parseInt(m[1]!, 10) : null;
}

export function gradCafeRowCreatedAt(row: GradCafeRow): string | null {
  const y = parseSeasonYear(row.season);
  if (row.date_of_notification) {
    try {
      return new Date(row.date_of_notification).toISOString();
    } catch {
      /* fall through */
    }
  }
  if (row.created_at) {
    const d = new Date(row.created_at);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  if (y) return new Date(`${y}-01-01`).toISOString();
  return null;
}

export type GradCafeCollectStats = {
  query: string;
  pages_fetched: number;
  rows_raw: number;
  rows_korean: number;
};

/** Fetch all pages for one query; return Korean-filtered unique rows. */
export async function collectGradCafeQuery(
  query: string,
  maxPages = MAX_PAGES_PER_QUERY
): Promise<{ rows: GradCafeRow[]; stats: GradCafeCollectStats }> {
  const seen = new Set<number>();
  const rows: GradCafeRow[] = [];
  let pagesFetched = 0;
  let rawCount = 0;
  let lastPage = 1;

  for (let page = 1; page <= Math.min(lastPage, maxPages); page++) {
    const url = buildGradCafeSearchUrl(query, page);
    const html = await fetchHtml(url, 25_000);
    const payload = parseGradCafeSearchPage(html);
    pagesFetched++;
    lastPage = payload.meta?.last_page ?? page;
    const pageRows = payload.data ?? [];
    rawCount += pageRows.length;

    for (const row of pageRows) {
      if (!row?.id || seen.has(row.id)) continue;
      if (!isKoreanGradCafeSchool(row.school ?? "")) continue;
      seen.add(row.id);
      rows.push(row);
    }

    if (pageRows.length === 0) break;
    if (page < lastPage) await sleep(FETCH_DELAY_MS);
  }

  return {
    rows,
    stats: {
      query,
      pages_fetched: pagesFetched,
      rows_raw: rawCount,
      rows_korean: rows.length,
    },
  };
}

export async function collectGradCafeUrls(
  queries: readonly string[] = GRADCAFE_TARGET_QUERIES
): Promise<{
  rows: GradCafeRow[];
  perQuery: GradCafeCollectStats[];
}> {
  const byId = new Map<number, GradCafeRow>();
  const perQuery: GradCafeCollectStats[] = [];

  for (const query of queries) {
    const { rows, stats } = await collectGradCafeQuery(query);
    perQuery.push(stats);
    for (const row of rows) {
      if (!byId.has(row.id)) byId.set(row.id, row);
    }
    console.log(
      `[gradcafe] query="${query}" pages=${stats.pages_fetched} raw=${stats.rows_raw} korean=${stats.rows_korean} total_unique=${byId.size}`
    );
    await sleep(FETCH_DELAY_MS);
  }

  return { rows: [...byId.values()], perQuery };
}

export type ScrapeGradCafeOptions = {
  limit?: number;
  queries?: readonly string[];
};

export async function scrapeGradCafe(
  options: ScrapeGradCafeOptions = {}
): Promise<
  ScrapeRunResult & {
    articles_found: number;
    per_query: GradCafeCollectStats[];
  }
> {
  resetClassifierRunCounter();
  const runId = await startPipelineRun(
    "gradcafe",
    `${GRADCAFE_ORIGIN}${GRADCAFE_SURVEY_PATH}`
  );
  setActivePipelineRunId(runId);

  const result: ScrapeRunResult & {
    articles_found: number;
    per_query: GradCafeCollectStats[];
  } = {
    collected: 0,
    processed: 0,
    saved: 0,
    failed: 0,
    skipped: 0,
    routed_admissions: 0,
    routed_review: 0,
    routed_general: 0,
    errors: [],
    articles_found: 0,
    per_query: [],
  };

  try {
    const { rows, perQuery } = await collectGradCafeUrls(options.queries);
    result.per_query = perQuery;
    result.articles_found = rows.length;

    const limit = options.limit ?? 200;
    const toProcess = rows.slice(0, limit);
    result.collected = toProcess.length;

    console.log(
      `[gradcafe] routing ${toProcess.length} / ${rows.length} Korean results (limit=${limit})`
    );

    for (const row of toProcess) {
      result.processed++;
      const searchUrl = buildGradCafeSearchUrl("Korean universities");
      const url = gradCafeRowUrl(row, searchUrl);
      const sourceId = gradCafeSourceId(row);

      try {
        const routeResult = await routeScrapedPost(
          scrapedPostFromRaw({
            source: "gradcafe",
            source_id: sourceId,
            title: gradCafeRowToTitle(row),
            content: gradCafeRowToContent(row),
            url,
            author: row.status?.trim() || "GradCafe",
            language: "en",
            source_created_at: gradCafeRowCreatedAt(row),
            skipClaude: false,
          })
        );

        if (routeResult.routed === "admission") {
          result.routed_admissions++;
          result.saved++;
        } else if (routeResult.routed === "review_needed") {
          result.routed_review++;
          result.saved++;
        } else if (routeResult.routed === "general") {
          result.routed_general++;
          result.saved++;
        } else {
          result.skipped++;
        }
      } catch (e) {
        result.failed++;
        const msg = e instanceof Error ? e.message : String(e);
        result.errors.push(`${sourceId}: ${msg}`);
        console.error(`[gradcafe] failed ${sourceId}:`, msg);
      }

      await sleep(200);
    }

    await finishPipelineRun(runId, {
      collected: result.collected,
      processed: result.processed,
      saved: result.saved,
      failed: result.failed,
      status:
        result.failed > 0 && result.saved === 0
          ? "partial"
          : result.failed > 0
            ? "partial"
            : "success",
      error_message: result.errors.slice(0, 8).join("; "),
      routed_admissions: result.routed_admissions,
      routed_review: result.routed_review,
      routed_general: result.routed_general,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    result.errors.push(msg);
    await finishPipelineRun(runId, {
      collected: result.collected,
      processed: result.processed,
      saved: result.saved,
      failed: result.failed + 1,
      status: "failed",
      error_message: msg,
      routed_admissions: result.routed_admissions,
      routed_review: result.routed_review,
      routed_general: result.routed_general,
    });
  } finally {
    setActivePipelineRunId(null);
  }

  console.log(
    `[gradcafe] done admissions=${result.routed_admissions} review=${result.routed_review} general=${result.routed_general}`
  );

  return result;
}
