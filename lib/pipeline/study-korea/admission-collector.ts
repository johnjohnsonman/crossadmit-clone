import { createAdminClient } from "@/lib/supabase/admin";
import { generateSlug } from "@/lib/utils/slug";
import { ADMISSION_QUERIES } from "./admission-queries";
import {
  FOREIGN_KEYWORDS,
  passesInternationalAdmissionFilter,
} from "./admission-filters";
import { isNaverConfigured } from "./naver-api";
import { searchNaverWebkr } from "./naver-webkr";
import { normalizeNaverPostUrl, webkrPostSourceId } from "./naver-url";

/** @deprecated passesInternationalAdmissionFilter 사용 */
export const ADMISSION_KEYWORD = FOREIGN_KEYWORDS;

export type CollectedAdmissionPost = {
  id: string;
  title: string;
  url: string;
};

/** Cron 전체 수집 시 쿼리 상한 (타임아웃 방지) */
export const ADMISSION_CRON_MAX_QUERIES = 50;

export type CollectAdmissionOptions = {
  targetNewCount?: number;
  startQueryIndex?: number;
  signal?: AbortSignal;
  /** 미지정 시 전체 쿼리; cron은 ADMISSION_CRON_MAX_QUERIES 권장 */
  maxQueries?: number;
};

export type CollectAdmissionStats = {
  newCount: number;
  dupCount: number;
  filteredCount: number;
  insertFailedCount: number;
  queriesUsed: number;
  nextStartIndex: number;
  sampleTitles: string[];
  collected: CollectedAdmissionPost[];
  aborted: boolean;
  naverConfigured: boolean;
  apiErrors: number;
};

export async function collectAdmissionPosts(
  opts: CollectAdmissionOptions = {}
): Promise<CollectAdmissionStats> {
  const targetCount = opts.targetNewCount ?? Number.POSITIVE_INFINITY;
  const startIndex = opts.startQueryIndex ?? 0;
  const signal = opts.signal;

  const supabase = createAdminClient();
  const allQueries = [...ADMISSION_QUERIES];
  const queryCap =
    opts.maxQueries != null && opts.maxQueries > 0
      ? Math.min(opts.maxQueries, allQueries.length)
      : allQueries.length;
  const queries = allQueries.slice(0, queryCap);
  const naverOk = isNaverConfigured();

  const stats: CollectAdmissionStats = {
    newCount: 0,
    dupCount: 0,
    filteredCount: 0,
    insertFailedCount: 0,
    queriesUsed: 0,
    nextStartIndex: startIndex,
    sampleTitles: [],
    collected: [],
    aborted: false,
    naverConfigured: naverOk,
    apiErrors: 0,
  };

  console.log("[ADMISSION] Starting collection", {
    targetNewCount: Number.isFinite(targetCount) ? targetCount : "all",
    startQueryIndex: startIndex,
    totalQueries: queries.length,
    naverConfigured: naverOk,
  });

  if (!naverOk) {
    console.error("[ADMISSION] NAVER_CLIENT_ID / NAVER_CLIENT_SECRET missing");
    return stats;
  }

  for (let i = startIndex; i < queries.length; i++) {
    if (signal?.aborted) {
      console.log("[ADMISSION] Aborted by client");
      stats.aborted = true;
      stats.nextStartIndex = i;
      break;
    }

    if (stats.newCount >= targetCount) {
      console.log(`[ADMISSION] Target ${targetCount} new posts reached`);
      stats.nextStartIndex = i;
      break;
    }

    const query = queries[i];
    stats.queriesUsed++;

    try {
      const items = await searchNaverWebkr(query, 30, 1, signal);
      console.log(`[ADMISSION] Query "${query}": ${items.length} items returned`);

      if (items.length === 0) {
        stats.apiErrors++;
      }

      for (const item of items) {
        if (signal?.aborted) {
          stats.aborted = true;
          stats.nextStartIndex = i;
          break;
        }
        if (stats.newCount >= targetCount) break;

        if (!item.link.trim()) continue;

        const url = normalizeNaverPostUrl(item.link) || item.link.trim();

        const { data: existing } = await supabase
          .from("study_korea_posts")
          .select("id")
          .eq("source", "naver_webkr")
          .eq("url", url)
          .maybeSingle();

        if (existing) {
          stats.dupCount++;
          continue;
        }

        const fullText = `${item.title} ${item.description}`;
        if (!passesInternationalAdmissionFilter(fullText)) {
          stats.filteredCount++;
          if (stats.filteredCount <= 5) {
            console.log(
              `[ADMISSION] Filtered out: "${item.title.slice(0, 40)}"`
            );
          }
          continue;
        }

        const source_id = webkrPostSourceId(url);
        const slug = generateSlug(item.title || "합격후기", source_id);
        const description = item.description;

        const { data, error } = await supabase
          .from("study_korea_posts")
          .insert({
            source: "naver_webkr",
            source_id,
            slug,
            title: item.title.slice(0, 500),
            content: description,
            url,
            author: "",
            category: "admission",
            subcategory: "admission",
            university: "",
            language: "ko",
            is_published: false,
            moderation_status: "pending",
            is_admission_post: true,
            post_type: "scraped",
            ai_summary: description.slice(0, 500),
            ai_summary_kr: description.slice(0, 500),
          })
          .select("id, title, url")
          .single();

        if (!error && data) {
          stats.newCount++;
          console.log(`[ADMISSION] NEW: "${item.title.slice(0, 50)}"`);
          stats.collected.push(data as CollectedAdmissionPost);
          if (stats.sampleTitles.length < 5) {
            stats.sampleTitles.push(item.title);
          }
        } else if (error) {
          stats.insertFailedCount++;
          console.warn("[ADMISSION] insert failed:", error.message);
        }

        await new Promise((r) => setTimeout(r, 100));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[ADMISSION] Query "${query}" failed:`, msg);
      stats.apiErrors++;
    }

    if (stats.aborted) break;

    await new Promise((r) => setTimeout(r, 200));
    stats.nextStartIndex = i + 1;
  }

  if (stats.nextStartIndex >= queries.length) {
    stats.nextStartIndex = 0;
  }

  console.log(
    `[ADMISSION] Done: ${stats.newCount} new, ${stats.dupCount} dup, ${stats.filteredCount} filtered, ${stats.insertFailedCount} insert failed, ${stats.apiErrors} empty/api errors`
  );

  return stats;
}
