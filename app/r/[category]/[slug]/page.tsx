import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AdSenseSlot from "@/components/ads/AdSenseSlot";
import StructuredData from "@/components/StructuredData";
import CommunitySidebar from "@/components/reddit-style/CommunitySidebar";
import RedditLayout from "@/components/reddit-style/RedditLayout";
import VoteColumn from "@/components/reddit-style/VoteColumn";
import {
  formatTimeAgo,
  postCommentsCount,
  postScore,
  sourceSubredditLabel,
} from "@/lib/forum/post-display";
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
  const title = post.ai_title_en?.trim() || post.title;
  const body =
    post.ai_content_en?.trim() ||
    post.ai_summary_en?.trim() ||
    post.ai_summary?.trim() ||
    "";
  const score = postScore(post);
  const comments = postCommentsCount(post);
  const sub = sourceSubredditLabel(post.source);
  const author = post.author?.replace(/^\/u\//, "") || "anonymous";
  const when = formatTimeAgo(post.source_created_at ?? post.created_at);
  const related = await getRelatedPosts(post.id, cat);
  const canonical = `${BASE}${postPath(cat, slug)}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: (post.ai_summary_en || post.ai_summary || "").slice(0, 200),
    datePublished: post.source_created_at ?? post.created_at,
    dateModified: post.created_at,
    author: { "@type": "Person", name: author },
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

      <article className="bg-white dark:bg-[#1A1A1B] border border-[#EDEFF1] dark:border-[#343536] rounded flex overflow-hidden">
        <div className="hidden md:flex p-2">
          <VoteColumn score={score} layout="side" />
        </div>
        <div className="flex-1 p-4 min-w-0">
          <p className="text-xs text-[#7C7C7C] mb-2">
            <Link
              href={`/r/${cat}`}
              className="font-bold text-[#1C1C1C] dark:text-[#D7DADC] hover:underline"
            >
              r/{sub}
            </Link>
            <span className="mx-1">·</span>
            Posted by u/{author}
            <span className="mx-1">·</span>
            {when}
          </p>
          <h1 className="text-2xl font-bold text-[#1C1C1C] dark:text-[#D7DADC] leading-tight">
            {title}
          </h1>

          <div className="my-4">
            <AdSenseSlot format="rectangle" />
          </div>

          <div className="prose prose-sm max-w-none text-[#1C1C1C] dark:text-[#D7DADC] leading-relaxed whitespace-pre-wrap">
            {body || (
              <p className="text-[#7C7C7C] italic">No content available.</p>
            )}
          </div>

          {post.url && (
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

      <section className="bg-white dark:bg-[#1A1A1B] border border-[#EDEFF1] dark:border-[#343536] rounded p-6">
        <h2 className="text-lg font-bold text-[#1C1C1C] dark:text-[#D7DADC] mb-2">
          Comments
        </h2>
        <p className="text-sm text-[#7C7C7C]">
          Comments coming soon — sign up to be notified when discussion
          launches (Phase 2).
        </p>
      </section>
    </RedditLayout>
  );
}
