import { analyzeStudyKoreaContent } from "./claude";
import { passesRedditPrefilter } from "./reddit-filter";
import {
  fetchRedditFeed,
  resetRedditFetchPreference,
  type RedditPostData,
} from "./reddit-fetch";
import { fillEmptySummaries, shouldSavePost } from "./relevance";
import { finishPipelineRun, startPipelineRun } from "./runs";
import { upsertStudyKoreaPost } from "./save";
import type { ScrapeRunResult } from "./types";
import { normalizeUniversitySlug } from "./university-map";

const CONTENT_FOR_AI_MAX = 500;

const KOREA_STUDY_KEYWORDS =
  /study|university|college|admission|scholarship|visa|dorm|exchange|international|tuition|campus|student/i;

type FeedDef = {
  url: string;
  label: string;
  filter?: (p: RedditPostData) => boolean;
};

function isKoreaStudyPost(p: RedditPostData): boolean {
  const text = `${p.title} ${p.selftext ?? ""} ${p.link_flair_text ?? ""}`;
  return KOREA_STUDY_KEYWORDS.test(text);
}

function buildSubredditFeeds(
  subreddit: string,
  options: { filter?: (p: RedditPostData) => boolean; sorts?: ("hot" | "new" | "top")[] } = {}
): FeedDef[] {
  const sorts = options.sorts ?? ["hot", "new", "top"];
  const feeds: FeedDef[] = [];
  for (const sort of sorts) {
    const base = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=25`;
    const url = sort === "top" ? `${base}&t=month` : base;
    feeds.push({
      url,
      label: `r/${subreddit} ${sort}`,
      filter: options.filter,
    });
  }
  return feeds;
}

const REDDIT_FEEDS: FeedDef[] = [
  ...buildSubredditFeeds("studyinkorea"),
  ...buildSubredditFeeds("korea", { filter: isKoreaStudyPost }),
  ...buildSubredditFeeds("Living_in_Korea"),
  ...buildSubredditFeeds("KoreanAdvice"),
  ...buildSubredditFeeds("teachinginkorea", { sorts: ["hot", "new"] }),
];

export async function scrapeRedditStudyKorea(): Promise<ScrapeRunResult> {
  resetRedditFetchPreference();

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

          const pre = passesRedditPrefilter(d);
          if (pre) {
            console.log(`[Reddit] prefilter skip ${d.id}: ${pre}`);
            continue;
          }

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
    console.log("[Reddit] fetched after prefilter:", posts.length);

    let relevantCount = 0;

    for (const d of posts) {
      result.processed++;
      const fullContent = (d.selftext ?? "").trim();
      const contentForAi = (
        fullContent || d.title || ""
      ).slice(0, CONTENT_FOR_AI_MAX);
      const url = d.permalink
        ? d.permalink.startsWith("http")
          ? d.permalink
          : `https://www.reddit.com${d.permalink}`
        : d.url || "";
      const title = (d.title ?? "").trim();
      const subreddit = d.subreddit ?? "studyinkorea";

      if (!title) {
        result.skipped++;
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
          ai_title_en: analysis.ai_title_en || title,
          ai_summary_en: analysis.ai_summary_en || analysis.ai_summary,
          ai_content_en: analysis.ai_content_en || fullContent.slice(0, 8000),
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
          is_relevant: false,
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
          ai_title_en: title,
          ai_summary_en: fallback.ai_summary_en,
          ai_content_en: fullContent.slice(0, 8000),
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
