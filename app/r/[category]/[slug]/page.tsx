import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AdSenseSlot from "@/components/ads/AdSenseSlot";
import CommentSection from "@/components/comments/CommentSection";
import StructuredData from "@/components/StructuredData";
import CommunitySidebar from "@/components/reddit-style/CommunitySidebar";
import RedditLayout from "@/components/reddit-style/RedditLayout";
import VoteColumn from "@/components/reddit-style/VoteColumn";
import AIGuideBanner from "@/components/reddit-style/AIGuideBanner";
import AIGuideBadge from "@/components/reddit-style/AIGuideBadge";
import GuideFeedback from "@/components/reddit-style/GuideFeedback";
import {
  formatTimeAgo,
  postCommentsCount,
  postScore,
  sourceSubredditLabel,
} from "@/lib/forum/post-display";
import { getCommentsForPost } from "@/lib/forum/comments";
import {
  getCategoryMeta,
  normalizePostCategory,
  postPath,
} from "@/lib/forum/reddit-categories";
import { getPostBySlug, getRelatedPosts } from "@/lib/forum/queries";

const BASE = "https://crossadmit.com";

type Props = {
  params: Promise<{ category: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const post = await getPostBySlug(category, slug);
  if (!post) return { title: "Post not found" };

  const cat = normalizePostCategory(post.category, post.subcategory);
  const titleEn = post.ai_title_en?.trim() || post.title;
  const description = (
    post.ai_summary_en ||
    post.ai_summary ||
    ""
  ).slice(0, 160);
  const canonical = `${BASE}${postPath(cat, slug)}`;

  return {
    title: `${titleEn} - r/${cat} | CrossAdmit`,
    description,
    alternates: { canonical },
    openGraph: {
      title: titleEn,
      description,
      type: "article",
      url: canonical,
    },
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { category, slug } = await params;
  const post = await getPostBySlug(category, slug);
  if (!post) notFound();

  const cat = normalizePostCategory(post.category, post.subcategory);
  const meta = getCategoryMeta(cat);
  const isUserAnon =
    post.post_type === "user_anon" || post.source === "user_anon";
  const isAiGuide =
    post.post_type === "ai_guide" ||
    post.source === "ai_guide" ||
    Boolean(post.is_ai_generated);
  const title = post.ai_title_en?.trim() || post.title;
  const body = isUserAnon
    ? post.content?.trim() ||
      post.ai_content_en?.trim() ||
      post.ai_summary_en?.trim() ||
      ""
    : isAiGuide
      ? post.ai_content_en?.trim() ||
        post.content?.trim() ||
        post.ai_summary_en?.trim() ||
        ""
      : post.ai_content_en?.trim() ||
        post.ai_summary_en?.trim() ||
        post.ai_summary?.trim() ||
        "";
  const score = postScore(post);
  const comments = postCommentsCount(post);
  const sub = isUserAnon ? meta.label : sourceSubredditLabel(post.source);
  const displayName = isUserAnon
    ? post.anonymous_nickname || "Anonymous"
    : post.author?.replace(/^\/u\//, "") || "anonymous";
  const when = formatTimeAgo(post.source_created_at ?? post.created_at);
  const related = await getRelatedPosts(post.id, cat);
  const commentList = await getCommentsForPost(post.id);
  const canonical = `${BASE}${postPath(cat, slug)}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: (post.ai_summary_en || post.ai_summary || "").slice(0, 200),
    datePublished: post.source_created_at ?? post.created_at,
    dateModified: post.ai_last_updated ?? post.created_at,
    author: isAiGuide
      ? { "@type": "Organization", name: "CrossAdmit" }
      : { "@type": "Person", name: displayName },
    publisher: {
      "@type": "Organization",
      name: "CrossAdmit",
      url: BASE,
    },
    mainEntityOfPage: canonical,
  };

  const sourceLabel =
    post.source === "reddit"
      ? "Reddit"
      : post.source.startsWith("naver")
        ? "Naver"
        : post.source === "user_anon"
          ? ""
          : post.source;

  return (
    <RedditLayout
      currentCategory={cat}
      rightSidebar={
        <CommunitySidebar category={cat} relatedPosts={related} />
      }
    >
      <StructuredData data={articleSchema} />

      <nav className="text-xs text-[#7C7C7C] mb-2 px-1">
        <Link href="/forum" className="hover:underline">
          Home
        </Link>
        <span className="mx-1">›</span>
        <Link href={`/r/${cat}`} className="hover:underline font-medium">
          r/{meta.label}
        </Link>
        <span className="mx-1">›</span>
        <span className="line-clamp-1">{title}</span>
      </nav>

      <article
        className={`rounded flex overflow-hidden border ${
          isAiGuide
            ? "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800"
            : "bg-white dark:bg-[#1A1A1B] border-[#EDEFF1] dark:border-[#343536]"
        }`}
      >
        <div className="hidden md:flex p-2">
          <VoteColumn score={score} layout="side" />
        </div>
        <div className="flex-1 p-4 min-w-0">
          <p className="text-xs text-[#7C7C7C] mb-2 flex flex-wrap items-center gap-2">
            {isAiGuide && <AIGuideBadge />}
            {isUserAnon ? (
              <>
                <Link
                  href={`/r/${cat}`}
                  className="font-bold text-[#1C1C1C] dark:text-[#D7DADC] hover:underline"
                >
                  r/{sub}
                </Link>
                <span className="mx-1">·</span>
                Posted by {displayName}
                <span className="mx-1">·</span>
                {when}
              </>
            ) : isAiGuide ? (
              <>
                <span className="text-purple-800 dark:text-purple-200 font-medium">
                  AI Generated Guide · CrossAdmit Knowledge Hub
                </span>
                <span className="mx-1">·</span>
                <Link
                  href={`/r/${cat}`}
                  className="font-bold text-[#1C1C1C] dark:text-[#D7DADC] hover:underline"
                >
                  r/{meta.label}
                </Link>
                <span className="mx-1">·</span>
                {when}
              </>
            ) : (
              <>
                <span className="text-[#7C7C7C]">
                  Originally from {sourceLabel || "external source"}
                </span>
                <span className="mx-1">·</span>
                <Link
                  href={`/r/${cat}`}
                  className="font-bold text-[#1C1C1C] dark:text-[#D7DADC] hover:underline"
                >
                  r/{sub}
                </Link>
                <span className="mx-1">·</span>
                {when}
              </>
            )}
          </p>
          <h1 className="text-2xl font-bold text-[#1C1C1C] dark:text-[#D7DADC] leading-tight">
            {title}
          </h1>

          {isAiGuide && (
            <AIGuideBanner
              sources={post.ai_sources as string[] | null}
              lastUpdated={post.ai_last_updated}
            />
          )}

          <div className="my-4">
            <AdSenseSlot format="rectangle" />
          </div>

          <div className="prose prose-sm max-w-none text-[#1C1C1C] dark:text-[#D7DADC] leading-relaxed whitespace-pre-wrap">
            {body || (
              <p className="text-[#7C7C7C] italic">No content available.</p>
            )}
          </div>

          {isAiGuide && post.ai_content_kr?.trim() && (
            <details className="mt-6 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
              <summary className="text-sm font-bold text-purple-900 dark:text-purple-100 cursor-pointer">
                한국어 버전 (Korean)
              </summary>
              <div className="mt-3 prose prose-sm max-w-none whitespace-pre-wrap text-[#1C1C1C] dark:text-[#D7DADC]">
                {post.ai_content_kr}
              </div>
            </details>
          )}

          {isAiGuide && <GuideFeedback postId={post.id} />}

          {!isUserAnon && !isAiGuide && post.url && (
            <p className="mt-4 text-sm">
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF4500] font-bold hover:underline"
              >
                View original on {sourceLabel} →
              </a>
            </p>
          )}

          <div className="md:hidden">
            <VoteColumn score={score} layout="bottom" />
          </div>

          <div className="mt-4 flex gap-2 text-xs font-bold text-[#7C7C7C]">
            <span>💬 {comments} Comments</span>
          </div>
        </div>
      </article>

      <div className="my-4">
        <AdSenseSlot />
      </div>

      <CommentSection postId={post.id} initialComments={commentList} />
    </RedditLayout>
  );
}
