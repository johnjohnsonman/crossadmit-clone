import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import RedditCategoryFeed from "@/components/reddit-style/RedditCategoryFeed";
import { getCategoryMeta, REDDIT_CATEGORIES } from "@/lib/forum/reddit-categories";
import { getCategorySeoName } from "@/lib/seo/categories";
import { seoAlternates, seoOpenGraph, seoTwitter } from "@/lib/seo/metadata";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string }>;
};

export async function generateStaticParams() {
  return REDDIT_CATEGORIES.map((c) => ({ category: c.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const meta = getCategoryMeta(category);
  const names = getCategorySeoName(category);
  const title = `r/${category} - ${names.en}`;
  const description = `${names.en} for international students in Korea. Read guides, share experiences, and ask questions. ${meta.description}`;

  return {
    title,
    description,
    alternates: seoAlternates(`/r/${category}`),
    openGraph: seoOpenGraph({
      title: `r/${category} | CrossAdmit`,
      description: `${names.en} community for international students.`,
      type: "website",
      url: `https://crossadmit.com/r/${category}`,
    }),
    twitter: seoTwitter(`r/${category} | CrossAdmit`, description),
  };
}

export default async function CategoryHubPage({ params, searchParams }: Props) {
  const { category } = await params;
  if (category.toLowerCase() === "youtube") {
    redirect("/videos");
  }
  const sp = await searchParams;
  const meta = REDDIT_CATEGORIES.find((c) => c.id === category);
  if (!meta) notFound();

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <RedditCategoryFeed
        categoryId={category}
        categoryMeta={meta}
        sort={sp.sort || "hot"}
      />
    </Suspense>
  );
}
