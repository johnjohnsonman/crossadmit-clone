import { analyzeStudyKoreaContent } from "./claude";
import { finishPipelineRun, startPipelineRun } from "./runs";
import { upsertStudyKoreaPost } from "./save";
import type { ScrapeRunResult } from "./types";
import { normalizeUniversitySlug } from "./university-map";

const USER_AGENT = "CrossAdmit/1.0";

const REDDIT_FEEDS = [
  "https://www.reddit.com/r/studyinkorea/hot.json?limit=25",
  "https://www.reddit.com/r/studyinkorea/new.json?limit=25",
  "https://www.reddit.com/r/korea/search.json?q=study+university&sort=new&limit=25",
];

interface RedditChild {
  data: {
    id: string;
    title: string;
    selftext: string;
    url: string;
    author: string;
    score: number;
    num_comments: number;
    created_utc: number;
    permalink: string;
  };
}

async function fetchRedditJson(url: string): Promise<RedditChild[]> {
  const doFetch = async () => {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      cache: "no-store",
    });
    if (res.status === 403) {
      const err = new Error("Reddit 403") as Error & { status?: number };
      err.status = 403;
      throw err;
    }
    if (!res.ok) throw new Error(`Reddit ${res.status}: ${url}`);
    const json = (await res.json()) as { data?: { children?: RedditChild[] } };
    return json.data?.children ?? [];
  };

  try {
    return await doFetch();
  } catch (e) {
    const err = e as Error & { status?: number };
    if (err.status === 403) {
      console.warn("[reddit] 403, retrying in 30s...");
      await new Promise((r) => setTimeout(r, 30000));
      return await doFetch();
    }
    throw e;
  }
}

export async function scrapeRedditStudyKorea(): Promise<ScrapeRunResult> {
  const runId = await startPipelineRun("reddit", REDDIT_FEEDS.join(","));
  const result: ScrapeRunResult = {
    collected: 0,
    processed: 0,
    saved: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  const seen = new Set<string>();
  const posts: RedditChild["data"][] = [];

  try {
    for (const feed of REDDIT_FEEDS) {
      const children = await fetchRedditJson(feed);
      for (const c of children) {
        const d = c.data;
        if (!d?.id || seen.has(d.id)) continue;
        seen.add(d.id);
        posts.push(d);
      }
    }
    result.collected = posts.length;

    for (const d of posts) {
      result.processed++;
      const content = d.selftext || "";
      const url = d.permalink
        ? `https://reddit.com${d.permalink}`
        : d.url || "";
      const title = d.title || "";

      try {
        const analysis = await analyzeStudyKoreaContent(title, content, {
          source: "reddit",
          url,
          author: d.author,
        });

        if (!analysis.is_relevant) {
          result.skipped++;
          continue;
        }

        const university =
          normalizeUniversitySlug(analysis.university, `${title} ${content}`) ||
          analysis.university;

        const status = await upsertStudyKoreaPost({
          source: "reddit",
          source_id: d.id,
          title,
          content: content.slice(0, 8000),
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
          content: content.slice(0, 8000),
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
      status: result.failed > 0 ? "partial" : "success",
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
