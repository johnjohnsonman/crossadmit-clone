import { analyzeStudyKoreaContent } from "./claude";
import { fetchRedditFeed, type RedditPostData } from "./reddit-fetch";
import {
  fillEmptySummaries,
  shouldSavePost,
} from "./relevance";
import { finishPipelineRun, startPipelineRun } from "./runs";
import { upsertStudyKoreaPost } from "./save";
import type { ScrapeRunResult } from "./types";
import { normalizeUniversitySlug } from "./university-map";

const CONTENT_FOR_AI_MAX = 500;

/** Furniblog-style feeds + study-korea subreddits */
const REDDIT_FEEDS: {
  url: string;
  label: string;
  filter?: (p: RedditPostData) => boolean;
}[] = [
  {
    url: "https://www.reddit.com/r/studyinkorea/hot.json?limit=25&t=week",
    label: "r/studyinkorea hot",
  },
  {
    url: "https://www.reddit.com/r/studyinkorea/new.json?limit=25",
    label: "r/studyinkorea new",
  },
  {
    url: "https://www.reddit.com/r/korea/search.json?q=university+study&sort=new&limit=25&t=month",
    label: "r/korea search",
    filter: isKoreaStudyPost,
  },
  {
    url: "https://www.reddit.com/r/Korean/hot.json?limit=25",
    label: "r/Korean hot",
    filter: isKoreanLanguagePost,
  },
  {
    url: "https://www.reddit.com/r/Korean/new.json?limit=25",
    label: "r/Korean new",
    filter: isKoreanLanguagePost,
  },
];

const KOREA_STUDY_KEYWORDS =
  /study|university|college|admission|scholarship|visa|dorm|exchange|international|tuition|campus/i;

const KOREAN_LANG_KEYWORDS =
  /topik|korean|hangul|language|grammar|vocab|study|learn|class|lesson|exam/i;

function isKoreanLanguagePost(p: RedditPostData): boolean {
  const text = `${p.title} ${p.selftext ?? ""}`;
  return KOREAN_LANG_KEYWORDS.test(text);
}

function isKoreaStudyPost(p: RedditPostData): boolean {
  const text = `${p.title} ${p.selftext ?? ""}`;
  return KOREA_STUDY_KEYWORDS.test(text);
}

export async function scrapeRedditStudyKorea(): Promise<ScrapeRunResult> {
  const runId = await startPipelineRun(
    "reddit",
    REDDIT_FEEDS.map((f) => f.label).join(", ")
  );
  const result: ScrapeRunResult = {
    collected: 0,
    processed: 0,
    saved: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  const seen = new Set<string>();
  const posts: RedditPostData[] = [];

  try {
    for (const feed of REDDIT_FEEDS) {
      try {
        const children = await fetchRedditFeed<RedditPostData>(
          feed.url,
          feed.label
        );
        let added = 0;
        for (const c of children) {
          const d = c.data;
          if (!d?.id || seen.has(d.id)) continue;
          if (feed.filter && !feed.filter(d)) continue;
          seen.add(d.id);
          posts.push(d);
          added++;
        }
        console.log(
          `[reddit-fetch] ${feed.label}: raw=${children.length} kept=${added}`
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        result.errors.push(`${feed.label}: ${msg}`);
        console.warn(`[reddit-fetch] ${feed.label} error:`, msg);
      }
    }

    result.collected = posts.length;
    console.log("[Reddit] fetched:", posts.length);

    let relevantCount = 0;

    for (const d of posts) {
      result.processed++;
      const fullContent = (d.selftext ?? "").trim();
      const contentForAi = (
        fullContent || d.title || ""
      ).slice(0, CONTENT_FOR_AI_MAX);
      const url = d.permalink
        ? `https://www.reddit.com${d.permalink}`
        : d.url || "";
      const title = (d.title ?? "").trim();
      const subreddit = d.subreddit ?? "studyinkorea";

      if (!title) {
        result.skipped++;
        console.log("[Reddit] skip empty title:", d.id);
        continue;
      }

      try {
        let analysis = await analyzeStudyKoreaContent(title, contentForAi, {
          source: "reddit",
          url,
          author: d.author,
          subreddit,
        });

        analysis = fillEmptySummaries(title, fullContent, analysis);

        const saveOk = shouldSavePost(
          subreddit,
          title,
          fullContent,
          analysis
        );

        console.log(
          `[Reddit] post ${d.id} r/${subreddit} save=${saveOk} claude_relevant=${analysis.is_relevant}`
        );

        if (!saveOk) {
          result.skipped++;
          continue;
        }

        if (analysis.is_relevant) relevantCount++;

        const university =
          normalizeUniversitySlug(
            analysis.university,
            `${title} ${fullContent.slice(0, 500)}`
          ) || analysis.university;

        const row = {
          source: "reddit" as const,
          source_id: d.id,
          title,
          content: fullContent.slice(0, 8000),
          url,
          author: d.author || "",
          upvotes: d.score ?? 0,
          comment_count: d.num_comments ?? 0,
          source_created_at: d.created_utc
            ? new Date(d.created_utc * 1000).toISOString()
            : null,
          category: analysis.category,
          university,
          ai_summary: analysis.ai_summary,
          ai_summary_kr: analysis.ai_summary_kr,
          ai_title_en: analysis.ai_title_en,
          ai_summary_en: analysis.ai_summary_en,
          ai_content_en: analysis.ai_content_en,
          ai_tags: analysis.ai_tags,
          is_published: analysis.is_relevant,
        };

        const status = await upsertStudyKoreaPost(row);
        if (status === "saved") result.saved++;
        else {
          result.failed++;
          result.errors.push(`upsert failed ${d.id}`);
        }
      } catch (e) {
        result.failed++;
        const msg = e instanceof Error ? e.message : String(e);
        result.errors.push(`reddit/${d.id}: ${msg}`);
        console.error(`[Reddit] process error ${d.id}:`, msg);

        const fallback = fillEmptySummaries(title, fullContent, {
          category: "general",
          university: "",
          ai_summary: title,
          ai_summary_kr: title,
          ai_tags: [],
          is_relevant: true,
        });

        const status = await upsertStudyKoreaPost({
          source: "reddit",
          source_id: d.id,
          title,
          content: fullContent.slice(0, 8000),
          url,
          author: d.author || "",
          upvotes: d.score ?? 0,
          comment_count: d.num_comments ?? 0,
          source_created_at: d.created_utc
            ? new Date(d.created_utc * 1000).toISOString()
            : null,
          category: fallback.category,
          ai_summary: fallback.ai_summary,
          ai_summary_kr: fallback.ai_summary_kr,
          ai_title_en: fallback.ai_title_en,
          ai_summary_en: fallback.ai_summary_en,
          ai_content_en: fallback.ai_content_en,
          is_published: false,
        });
        if (status === "saved") {
          console.log(`[Reddit] saved unpublished fallback ${d.id}`);
        }
      }
    }

    console.log("[Reddit] relevant:", relevantCount);
    console.log("[Reddit] saved:", result.saved);
    console.log("[Reddit] skipped:", result.skipped);
    console.log("[Reddit] failed:", result.failed);

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
    console.error("[Reddit] pipeline error:", msg);
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
