/**
 * Naver webkr 합격 후기 — routeScrapedPost() 라우팅.
 * (어드민 「합격 후기 자동 수집」의 admission-collector는 별도 검토 큐 경로 유지)
 */
import { ADMISSION_QUERIES } from "@/lib/pipeline/study-korea/admission-queries";
import { passesInternationalAdmissionFilter } from "@/lib/pipeline/study-korea/admission-filters";
import { isNaverConfigured } from "@/lib/pipeline/study-korea/naver-api";
import { searchNaverWebkr } from "@/lib/pipeline/study-korea/naver-webkr";
import { normalizeNaverPostUrl, webkrPostSourceId } from "@/lib/pipeline/study-korea/naver-url";
import { routeScrapedPost, scrapedPostFromRaw } from "@/lib/scrapers/router";
import { setActivePipelineRunId } from "@/lib/scrapers/run-context";
import {
  finishPipelineRun,
  startPipelineRun,
} from "@/lib/pipeline/study-korea/runs";
import { EMPTY_SCRAPE_RESULT } from "@/lib/pipeline/study-korea/types";
import { resetClassifierRunCounter } from "@/lib/classifiers/classifier-usage";

const MAX_QUERIES = 5;

export async function scrapeNaverWebkrRouted(maxQueries = MAX_QUERIES) {
  if (!isNaverConfigured()) {
    return { ...EMPTY_SCRAPE_RESULT, errors: ["NAVER credentials not configured"] };
  }

  resetClassifierRunCounter();
  const runId = await startPipelineRun("naver_webkr", "routed webkr admission search");
  setActivePipelineRunId(runId);

  const result = { ...EMPTY_SCRAPE_RESULT, errors: [] as string[] };
  const queries = ADMISSION_QUERIES.slice(0, maxQueries);

  try {
    for (const query of queries) {
      const items = await searchNaverWebkr(query, 20, 1);
      for (const item of items) {
        result.collected++;
        const url = normalizeNaverPostUrl(item.link) || item.link.trim();
        if (!url) continue;

        const fullText = `${item.title} ${item.description}`;
        if (!passesInternationalAdmissionFilter(fullText)) {
          result.skipped++;
          continue;
        }

        result.processed++;
        try {
          const routeResult = await routeScrapedPost(
            scrapedPostFromRaw({
              source_id: webkrPostSourceId(url),
              title: item.title,
              content: item.description,
              url,
              language: "ko",
              source: "naver_webkr",
            })
          );

          if (routeResult.routed === "admission") result.routed_admissions++;
          else if (routeResult.routed === "review_needed") result.routed_review++;
          else if (routeResult.routed === "general") result.routed_general++;
          else result.skipped++;

          if (
            routeResult.routed === "admission" ||
            routeResult.routed === "review_needed" ||
            routeResult.routed === "general"
          ) {
            result.saved++;
          }
        } catch (e) {
          result.failed++;
          result.errors.push(
            e instanceof Error ? e.message : String(e)
          );
        }
      }
    }

    await finishPipelineRun(runId, {
      collected: result.collected,
      processed: result.processed,
      saved: result.saved,
      failed: result.failed,
      status: result.failed > 0 ? "partial" : "success",
      error_message: result.errors.slice(0, 5).join("; "),
      routed_admissions: result.routed_admissions,
      routed_review: result.routed_review,
      routed_general: result.routed_general,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    result.errors.push(msg);
    await finishPipelineRun(runId, {
      ...result,
      failed: result.failed + 1,
      status: "failed",
      error_message: msg,
    });
  } finally {
    setActivePipelineRunId(null);
  }

  return result;
}
