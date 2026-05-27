import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import AdSenseSlot from "@/components/ads/AdSenseSlot";
import CommentSection from "@/components/comments/CommentSection";
import StructuredData from "@/components/StructuredData";
import CommunitySidebar from "@/components/reddit-style/CommunitySidebar";
import MentorRecommendation from "@/components/forum/MentorRecommendation";
import RedditLayout from "@/components/reddit-style/RedditLayout";
import VoteColumn from "@/components/reddit-style/VoteColumn";
import AIGuideBanner from "@/components/reddit-style/AIGuideBanner";
import AIGuideBadge from "@/components/reddit-style/AIGuideBadge";
import AIGuideContent from "@/components/reddit-style/AIGuideContent";
import AIGuideSources from "@/components/reddit-style/AIGuideSources";
import GuideFeedback from "@/components/reddit-style/GuideFeedback";
import WritePostCta from "@/components/reddit-style/WritePostCta";
import PostEditControls from "@/components/posts/PostEditControls";
import { hasAdminCookieSession } from "@/lib/admin/server-session";
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
import { SITE_URL } from "@/lib/seo/constants";
import { seoAlternates, seoOpenGraph, seoTwitter } from "@/lib/seo/metadata";

const BASE = SITE_URL;

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
    post.ai_summary_kr ||
    post.ai_summary ||
    ""
  ).slice(0, 160);
  const path = postPath(cat, slug);
  const isAi =
    post.post_type === "ai_guide" ||
    post.source === "ai_guide" ||
    Boolean(post.is_ai_generated);

  return {
    title: titleEn,
    description,
    alternates: seoAlternates(path),
    openGraph: seoOpenGraph({
      title: titleEn,
      description,
      type: "article",
      url: `${BASE}${path}`,
      publishedTime: post.source_created_at ?? post.created_at,
      modifiedTime: post.ai_last_updated ?? post.created_at,
      authors: isAi ? ["CrossAdmit AI"] : ["CrossAdmit Community"],
    }),
    twitter: seoTwitter(titleEn, description),
  };
}

export default async function PostDetailPage({ params }: Props) {
  const { category, slug } = await params;
  if (category.toLowerCase() === "youtube") {
    redirect("/videos");
  }
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
  const isAdmin = await hasAdminCookieSession();
  const canonical = `${BASE}${postPath(cat, slug)}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: (post.ai_summary_en || post.ai_summary_kr || post.ai_summary || "").slice(
      0,
      200
    ),
    image: `${BASE}/opengraph-image`,
    datePublished: post.source_created_at ?? post.created_at,
    dateModified: post.ai_last_updated ?? post.created_at,
    author: isAiGuide
      ? { "@type": "Organization", name: "CrossAdmit AI" }
      : {
          "@type": "Person",
          name: post.anonymous_nickname || displayName || "CrossAdmit Community",
        },
    publisher: {
      "@type": "Organization",
      name: "CrossAdmit",
      logo: {
        "@type": "ImageObject",
        url: `${BASE}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical,
    },
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
        <>
          <MentorRecommendation category={cat} />
          <CommunitySidebar category={cat} relatedPosts={related} />
        </>
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

      <article className="rounded flex overflow-hidden border bg-white dark:bg-[#1A1A1B] border-[#EDEFF1] dark:border-[#343536]">
        <div className="hidden md:flex p-2">
          <VoteColumn score={score} layout="side" />
        </div>
        <div className="flex-1 p-4 min-w-0">
          <p className="text-xs text-[#7C7C7C] mb-2 flex flex-wrap items-center gap-2">
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
          {isAiGuide && (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <AIGuideBadge />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                AI Generated · Verified Sources
              </span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-[#1C1C1C] dark:text-[#D7DADC] leading-tight">
            {title}
          </h1>

          {isAiGuide && <AIGuideBanner />}

          <div className="my-4">
            <AdSenseSlot format="rectangle" />
          </div>

          {isAiGuide ? (
            <>
              <AIGuideContent
                contentEn={body}
                contentKr={post.ai_content_kr}
              />
              <AIGuideSources
                sources={post.ai_sources}
                lastUpdated={post.ai_last_updated}
              />
              <GuideFeedback postId={post.id} />
            </>
          ) : (
            <div className="prose prose-sm max-w-none text-[#1C1C1C] dark:text-[#D7DADC] leading-relaxed whitespace-pre-wrap">
              {body || (
                <p className="text-[#7C7C7C] italic">No content available.</p>
              )}
            </div>
          )}

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

          <PostEditControls
            postId={post.id}
            category={cat}
            initialIsAdmin={isAdmin}
          />
        </div>
      </article>

      <div className="my-4">
        <AdSenseSlot />
      </div>

      <WritePostCta category={cat} className="mb-4 lg:hidden" />

      <CommentSection postId={post.id} initialComments={commentList} />
    </RedditLayout>
  );
}
