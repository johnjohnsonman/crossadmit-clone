import { analyzeRedditPost } from "../ai/claude";
import type { ProcessedAdmission, RedditPost } from "../../scripts/sources/types";

export interface ProcessPostsOptions {
  source: string;
  minRelevance?: number;
  delayMs?: number;
  onProgress?: (current: number, total: number, post: RedditPost) => void;
}

export interface ProcessPostsResult {
  processed: ProcessedAdmission[];
  skipped: number;
  failed: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reddit 포스트 배열을 Claude로 처리해 ProcessedAdmission 목록으로 변환합니다.
 */
export async function processPosts(
  posts: RedditPost[],
  options: ProcessPostsOptions
): Promise<ProcessPostsResult> {
  const minRelevance = options.minRelevance ?? 0.4;
  const delayMs = options.delayMs ?? 800;
  const processed: ProcessedAdmission[] = [];
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    options.onProgress?.(i + 1, posts.length, post);

    try {
      const result = await analyzeRedditPost(post, options.source);
      if (!result || result.relevance_score < minRelevance) {
        skipped++;
        console.log(
          `[processor] skip ${post.id} (relevance ${result?.relevance_score ?? 0})`
        );
      } else {
        processed.push(result);
        console.log(
          `[processor] ok ${post.id} → ${result.university ?? "unknown uni"} (score ${result.relevance_score})`
        );
      }
    } catch (error) {
      failed++;
      console.error(
        `[processor] fail ${post.id}:`,
        error instanceof Error ? error.message : error
      );
    }

    if (i < posts.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  return { processed, skipped, failed };
}
