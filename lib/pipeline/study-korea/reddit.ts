import { analyzeStudyKoreaContent } from "./claude";
import { fetchRedditFeed, type RedditPostData } from "./reddit-fetch";
import { finishPipelineRun, startPipelineRun } from "./runs";
import { upsertStudyKoreaPost } from "./save";
import type { ScrapeRunResult } from "./types";
import { normalizeUniversitySlug } from "./university-map";

const CONTENT_FOR_AI_MAX = 500;

/** Furniblog-style feeds + study-korea subreddits */
const REDDIT_FEEDS: { url: string; label: string; filter?: (p: RedditPostData) => boolean }[] = [
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
  const text = `${p.title} ${p.selftext}`;
  return KOREAN_LANG_KEYWORDS.test(text);
}

function isKoreaStudyPost(p: RedditPostData): boolean {
  const text = `${p.title} ${p.selftext}`;
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
        const children = await fetchRedditFeed<RedditPostData>(feed.url, feed.label);
        for (const c of children) {
          const d = c.data;
          if (!d?.id || seen.has(d.id)) continue;
          if (feed.filter && !feed.filter(d)) continue;
          if (
            (d.subreddit?.toLowerCase() === "korea" || feed.label.includes("korea search")) &&
            !isKoreaStudyPost(d)
          ) {
            continue;
          }
          seen.add(d.id);
          posts.push(d);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        result.errors.push(`${feed.label}: ${msg}`);
      }
    }

    result.collected = posts.length;

    for (const d of posts) {
      result.processed++;
      const fullContent = d.selftext || "";
      const contentForAi = fullContent.slice(0, CONTENT_FOR_AI_MAX);
      const url = d.permalink
        ? `https://www.reddit.com${d.permalink}`
        : d.url || "";
      const title = d.title || "";

      try {
        const analysis = await analyzeStudyKoreaContent(title, contentForAi, {
          source: "reddit",
          url,
          author: d.author,
        });

        if (!analysis.is_relevant) {
          result.skipped++;
          continue;
        }

        const university =
          normalizeUniversitySlug(
            analysis.university,
            `${title} ${fullContent.slice(0, 500)}`
          ) || analysis.university;

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
          category: analysis.category,
          university,
          ai_summary: analysis.ai_summary,
          ai_summary_kr: analysis.ai_summary_kr,
          ai_tags: analysis.ai_tags,
          is_published: true,
        });
        if (status === "saved") result.saved++;
        else result.failed++;
      } catch (e) {
        result.failed++;
        const msg = e instanceof Error ? e.message : String(e);
        result.errors.push(`reddit/${d.id}: ${msg}`);
        await upsertStudyKoreaPost({
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
          is_published: false,
        });
      }
    }

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
