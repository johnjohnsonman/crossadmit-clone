import { analyzeStudyKoreaContent } from "./claude";
import { fillEmptySummaries, shouldSavePost } from "./relevance";
import { finishPipelineRun, startPipelineRun } from "./runs";
import { upsertStudyKoreaPost } from "./save";
import type {
  ScrapeRunResult,
  StudyKoreaCategory,
  StudyKoreaSource,
} from "./types";
import { normalizeUniversitySlug } from "./university-map";

export interface RawStudyKoreaItem {
  source_id: string;
  title: string;
  content: string;
  url: string;
  author?: string;
  category?: StudyKoreaCategory;
  university?: string;
  university_id?: number | null;
  language?: string;
  upvotes?: number;
  comment_count?: number;
  source_created_at?: string | null;
  skipClaude?: boolean;
}

const ITEM_DELAY_MS = 400;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function processAndSaveItems(
  runSource: string,
  source: StudyKoreaSource,
  items: RawStudyKoreaItem[],
  query = ""
): Promise<ScrapeRunResult> {
  const runId = await startPipelineRun(runSource, query);
  const result: ScrapeRunResult = {
    collected: items.length,
    processed: 0,
    saved: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  console.log(`[${runSource}] collected:`, items.length);

  try {
    for (const item of items) {
      result.processed++;
      const title = item.title.trim();
      const content = (item.content ?? "").trim();
      if (!title && !content) {
        result.skipped++;
        continue;
      }

      try {
        let category = item.category ?? "general";
        let university = item.university ?? "";
        let ai_summary = title;
        let ai_summary_kr = title;
        let ai_title_en = "";
        let ai_summary_en = "";
        let ai_content_en = "";
        let ai_tags: string[] = [];

        if (!item.skipClaude) {
          const analysis = fillEmptySummaries(
            title,
            content,
            await analyzeStudyKoreaContent(title, content.slice(0, 500), {
              source,
              url: item.url,
              author: item.author,
            })
          );

          if (
            !shouldSavePost(undefined, title, content, analysis)
          ) {
            result.skipped++;
            continue;
          }

          category = item.category ?? analysis.category;
          university =
            item.university ||
            normalizeUniversitySlug(analysis.university, `${title} ${content}`) ||
            analysis.university;
          ai_summary = analysis.ai_summary;
          ai_summary_kr = analysis.ai_summary_kr;
          ai_title_en = analysis.ai_title_en;
          ai_summary_en = analysis.ai_summary_en;
          ai_content_en = analysis.ai_content_en;
          ai_tags = analysis.ai_tags;
        } else if (!title) {
          result.skipped++;
          continue;
        }

        const status = await upsertStudyKoreaPost({
          source,
          source_id: item.source_id,
          title: title || content.slice(0, 120),
          content: content.slice(0, 8000),
          url: item.url,
          author: item.author ?? "",
          upvotes: item.upvotes ?? 0,
          comment_count: item.comment_count ?? 0,
          source_created_at: item.source_created_at ?? null,
          category,
          subcategory: (item.category ?? category) as typeof category,
          university,
          university_id: item.university_id ?? undefined,
          language: item.language ?? (source === "naver_blog" ? "ko" : "en"),
          ai_summary,
          ai_summary_kr,
          ai_title_en,
          ai_summary_en,
          ai_content_en,
          ai_tags,
          is_published: true,
        });

        if (status === "saved") result.saved++;
        else {
          result.failed++;
          result.errors.push(`upsert ${item.source_id}`);
        }
      } catch (e) {
        result.failed++;
        const msg = e instanceof Error ? e.message : String(e);
        result.errors.push(`${item.source_id}: ${msg}`);
      }

      await sleep(ITEM_DELAY_MS);
    }

    await finishPipelineRun(runId, {
      collected: result.collected,
      processed: result.processed,
      saved: result.saved,
      failed: result.failed,
      status:
        result.saved === 0 && result.collected > 0
          ? "partial"
          : result.failed > 0
            ? "partial"
            : "success",
      error_message: result.errors.slice(0, 5).join("; "),
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
  }

  console.log(`[${runSource}] saved:`, result.saved);
  return result;
}
