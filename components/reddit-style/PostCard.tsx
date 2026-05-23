"use client";

import Link from "next/link";
import VoteColumn from "./VoteColumn";
import {
  formatTimeAgo,
  postCommentsCount,
  postScore,
  sourceSubredditLabel,
} from "@/lib/forum/post-display";
import { normalizePostCategory, postPath } from "@/lib/forum/reddit-categories";
import AIGuideBadge from "./AIGuideBadge";

export type RedditPostCardData = {
  id: string;
  source: string;
  title: string;
  url: string;
  author?: string | null;
  category: string;
  subcategory?: string | null;
  post_type?: string | null;
  is_ai_generated?: boolean | null;
  anonymous_nickname?: string | null;
  slug?: string | null;
  upvotes?: number | null;
  upvotes_count?: number | null;
  downvotes_count?: number | null;
  comments_count?: number | null;
  comment_count?: number | null;
  ai_title_en?: string | null;
  ai_summary_en?: string | null;
  ai_summary?: string | null;
  source_created_at?: string | null;
  created_at: string;
};

type Props = {
  post: RedditPostCardData;
};

export default function PostCard({ post }: Props) {
  const cat = normalizePostCategory(post.category, post.subcategory);
  const href = post.slug ? postPath(cat, post.slug) : post.url;
  const isUserAnon =
    post.post_type === "user_anon" || post.source === "user_anon";
  const isAiGuide =
    post.post_type === "ai_guide" ||
    post.source === "ai_guide" ||
    Boolean(post.is_ai_generated);
  const isExternal = !post.slug;
  const title = post.ai_title_en?.trim() || post.title;
  const preview =
    post.ai_summary_en?.trim() || post.ai_summary?.trim() || "";
  const score = postScore(post);
  const comments = postCommentsCount(post);
  const sub = isAiGuide ? "AI-Guides" : isUserAnon ? cat : sourceSubredditLabel(post.source);
  const author = isUserAnon
    ? post.anonymous_nickname || post.author || "Anonymous"
    : post.author?.replace(/^\/u\//, "") || "anonymous";
  const when = formatTimeAgo(post.source_created_at ?? post.created_at);

  const inner = (
    <>
      <div className="hidden md:flex">
        <VoteColumn score={score} layout="side" />
      </div>
      <div className="flex-1 min-w-0 py-2 pr-3">
        <p className="text-xs text-[#7C7C7C] dark:text-[#818384] mb-1 flex flex-wrap items-center gap-1">
          {isAiGuide && <AIGuideBadge compact />}
          <Link
            href={`/r/${cat}`}
            className="font-bold hover:underline text-[#1C1C1C] dark:text-[#D7DADC]"
          >
            r/{sub}
          </Link>
          <span>·</span>
          {isAiGuide ? (
            <span className="text-purple-700 dark:text-purple-300 font-medium">
              AI Generated Guide
            </span>
          ) : (
            <>
              Posted by {isUserAnon ? "" : "u/"}
              {author}
            </>
          )}
          <span>·</span>
          {when}
        </p>
        <h2 className="text-base font-semibold text-[#1C1C1C] dark:text-[#D7DADC] leading-snug hover:text-[#FF4500]">
          {title}
        </h2>
        {preview && (
          <p className="mt-1.5 text-sm text-[#7C7C7C] dark:text-[#818384] line-clamp-2">
            {preview}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-[#7C7C7C] dark:text-[#818384]">
          {post.slug && (
            <span className="text-[#FF4500]">Read more →</span>
          )}
          <span>💬 {comments} Comments</span>
          <span className="cursor-pointer hover:bg-[#EDEFF1] dark:hover:bg-[#343536] px-2 py-1 rounded">
            ⤴ Share
          </span>
          <span className="cursor-pointer hover:bg-[#EDEFF1] dark:hover:bg-[#343536] px-2 py-1 rounded">
            🔖 Save
          </span>
        </div>
        <VoteColumn score={score} layout="bottom" />
      </div>
    </>
  );

  const cardClass = isAiGuide
    ? "flex bg-purple-50/80 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded hover:border-purple-400 dark:hover:border-purple-600 transition-colors overflow-hidden"
    : "flex bg-white dark:bg-[#1A1A1B] border border-[#EDEFF1] dark:border-[#343536] rounded hover:border-[#898989] dark:hover:border-[#818384] transition-colors overflow-hidden";

  if (isExternal) {
    return (
      <article className={cardClass}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 min-w-0"
        >
          {inner}
        </a>
      </article>
    );
  }

  return (
    <article className={cardClass}>
      <Link href={href} className="flex flex-1 min-w-0">
        {inner}
      </Link>
    </article>
  );
}
