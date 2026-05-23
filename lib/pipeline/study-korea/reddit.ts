import { analyzeStudyKoreaContent } from "./claude";
import { collectRedditRssPosts } from "./reddit-rss";
import { fillEmptySummaries, shouldSavePost } from "./relevance";
import { finishPipelineRun, startPipelineRun } from "./runs";
import { upsertStudyKoreaPost } from "./save";
import type { ScrapeRunResult } from "./types";
import { normalizeUniversitySlug } from "./university-map";

const CONTENT_FOR_AI_MAX = 500;

export async function scrapeRedditStudyKorea(): Promise<ScrapeRunResult> {
  const runId = await startPipelineRun("reddit", "RSS feeds (5 subreddits)");
  const result: ScrapeRunResult = {
    collected: 0,
    processed: 0,
    saved: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const {
      items,
      errors: collectErrors,
      skippedExisting,
      skippedDuplicate,
      skippedFilter,
    } = await collectRedditRssPosts();

    result.errors.push(...collectErrors);
    result.collected = items.length;
    result.skipped = skippedExisting + skippedDuplicate + skippedFilter;

    console.log(
      `[Reddit RSS] ready=${items.length} skip_db=${skippedExisting} skip_dup=${skippedDuplicate} skip_kw=${skippedFilter}`
    );

    let relevantCount = 0;

    for (const item of items) {
      result.processed++;
      const title = item.title.trim();
      const fullContent = item.content.trim();
      const contentForAi = (
        fullContent || title
      ).slice(0, CONTENT_FOR_AI_MAX);
      const url = item.link;
      const subreddit = item.subreddit;

      const universityFromTitle = normalizeUniversitySlug("", title);

      try {
        let analysis = await analyzeStudyKoreaContent(title, contentForAi, {
          source: "reddit",
          url,
          author: item.author,
          subreddit,
          language: "en",
        });

        analysis = fillEmptySummaries(title, fullContent, analysis);

        if (!shouldSavePost(subreddit, title, fullContent, analysis)) {
          result.skipped++;
          continue;
        }

        if (analysis.is_relevant) relevantCount++;

        const university =
          normalizeUniversitySlug(
            analysis.university || universityFromTitle,
            `${title} ${fullContent.slice(0, 500)}`
          ) ||
          analysis.university ||
          universityFromTitle;

        const sourceCreated = item.pubDate
          ? new Date(item.pubDate).toISOString()
          : null;

        const row = {
          source: "reddit" as const,
          source_id: item.id,
          title,
          content: fullContent.slice(0, 8000),
          url,
          author: item.author,
          language: "en" as const,
          upvotes: 0,
          comment_count: 0,
          source_created_at: sourceCreated,
          category: analysis.category,
          university,
          ai_summary: analysis.ai_summary,
          ai_summary_kr: analysis.ai_summary_kr,
          ai_title_en: analysis.ai_title_en || title,
          ai_summary_en: analysis.ai_summary_en || analysis.ai_summary,
          ai_content_en:
            analysis.ai_content_en || fullContent.slice(0, 8000),
          ai_tags: analysis.ai_tags,
          is_published: analysis.is_relevant,
        };

        const status = await upsertStudyKoreaPost(row);
        if (status === "saved") result.saved++;
        else {
          result.failed++;
          result.errors.push(`upsert failed ${item.id}`);
        }
      } catch (e) {
        result.failed++;
        const msg = e instanceof Error ? e.message : String(e);
        result.errors.push(`reddit/${item.id}: ${msg}`);
        console.error(`[Reddit RSS] process error ${item.id}:`, msg);

        const fallback = fillEmptySummaries(title, fullContent, {
          category: "general",
          university: universityFromTitle,
          ai_summary: title,
          ai_summary_kr: "",
          ai_tags: [],
          is_relevant: false,
        });

        await upsertStudyKoreaPost({
          source: "reddit",
          source_id: item.id,
          title,
          content: fullContent.slice(0, 8000),
          url,
          author: item.author,
          language: "en",
          upvotes: 0,
          comment_count: 0,
          source_created_at: item.pubDate
            ? new Date(item.pubDate).toISOString()
            : null,
          category: fallback.category,
          university: universityFromTitle,
          ai_summary: fallback.ai_summary,
          ai_summary_kr: fallback.ai_summary_kr,
          ai_title_en: title,
          ai_summary_en: fallback.ai_summary_en,
          ai_content_en: fullContent.slice(0, 8000),
          is_published: false,
        });
      }
    }

    console.log("[Reddit RSS] relevant:", relevantCount, "saved:", result.saved);

    await finishPipelineRun(runId, {
      collected: result.collected,
      processed: result.processed,
      saved: result.saved,
      failed: result.failed,
      status:
        result.errors.length > 0 && result.saved === 0
          ? "failed"
          : result.failed > 0 || result.errors.length > 0
            ? "partial"
            : "success",
      error_message: result.errors.slice(0, 5).join("; "),
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
    });
  }

  return result;
}
