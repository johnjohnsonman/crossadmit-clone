"use client";

import { useCallback, useEffect, useState } from "react";
import AdSenseSlot from "@/components/ads/AdSenseSlot";
import PostCard, { type RedditPostCardData } from "./PostCard";
import RedditLayout from "./RedditLayout";
import SortTabs from "./SortTabs";
import CommunitySidebar from "./CommunitySidebar";
import type { RedditCategoryId } from "@/lib/forum/reddit-categories";

type CategoryMeta = {
  id: RedditCategoryId;
  emoji: string;
  label: string;
  description: string;
};

type Props = {
  categoryId: string;
  categoryMeta: CategoryMeta;
  sort: string;
};

const PAGE_SIZE = 20;

async function fetchForumPosts(params: URLSearchParams) {
  const res = await fetch(`/api/forum?${params}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to load posts");
  return {
    posts: (json.posts ?? []) as RedditPostCardData[],
    total: json.total ?? 0,
  };
}

export default function RedditCategoryFeed({
  categoryId,
  categoryMeta,
  sort,
}: Props) {
  const [guides, setGuides] = useState<RedditPostCardData[]>([]);
  const [guidesTotal, setGuidesTotal] = useState(0);
  const [posts, setPosts] = useState<RedditPostCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sortParam = sort === "latest" ? "new" : sort;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const guideParams = new URLSearchParams({
        limit: "10",
        offset: "0",
        category: categoryId,
        sort: sortParam,
        kind: "guides",
      });
      const discParams = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
        category: categoryId,
        sort: sortParam,
        kind: "discussions",
      });

      const [guideRes, discRes] = await Promise.all([
        fetchForumPosts(guideParams),
        fetchForumPosts(discParams),
      ]);

      setGuides(guideRes.posts);
      setGuidesTotal(guideRes.total);
      setPosts(discRes.posts);
      setTotal(discRes.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [page, sortParam, categoryId]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    setPage(0);
  }, [sort, categoryId]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const basePath = `/r/${categoryId}`;

  return (
    <RedditLayout
      currentCategory={categoryId}
      sort={sort}
      rightSidebar={<CommunitySidebar category={categoryId} />}
    >
      <div className="bg-white dark:bg-[#1A1A1B] border border-[#EDEFF1] dark:border-[#343536] rounded-t p-4 mb-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{categoryMeta.emoji}</span>
          <div>
            <h1 className="text-xl font-bold text-[#1C1C1C] dark:text-[#D7DADC]">
              r/{categoryMeta.label}
            </h1>
            <p className="text-sm text-[#7C7C7C] mt-0.5">
              {categoryMeta.description}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="mt-3 px-4 py-1 rounded-full bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors"
        >
          Subscribe (Phase 2)
        </button>
      </div>
      <SortTabs sort={sort} basePath={basePath} />

      <div className="space-y-2 pt-2">
        {loading ? (
          <div className="p-8 text-center text-sm bg-white rounded border">
            Loading…
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600 bg-white rounded border">
            {error}
          </div>
        ) : (
          <>
            {(guides.length > 0 || guidesTotal > 0) && (
              <section className="mb-4">
                <h2 className="text-sm font-bold text-orange-900 dark:text-orange-200 px-1 mb-2 flex items-center gap-2">
                  📚 Guides
                  <span className="text-xs font-normal text-orange-700 dark:text-orange-400">
                    AI-generated · factual
                  </span>
                </h2>
                <div className="space-y-2">
                  {guides.map((p) => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
                {guidesTotal > guides.length && (
                  <p className="text-xs text-orange-700 dark:text-orange-400 px-1 mt-2">
                    Showing {guides.length} of {guidesTotal} guides in this
                    category
                  </p>
                )}
              </section>
            )}

            <section>
              <h2 className="text-sm font-bold text-[#1C1C1C] dark:text-[#D7DADC] px-1 mb-2">
                💬 Discussions
              </h2>
              {posts.length === 0 ? (
                <div className="p-6 text-center text-sm bg-white dark:bg-[#1A1A1B] rounded border text-[#7C7C7C]">
                  No discussions in this category yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {posts.map((p, i) => (
                    <div key={p.id}>
                      {i === 4 && (
                        <div className="my-2">
                          <AdSenseSlot />
                        </div>
                      )}
                      <PostCard post={p} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {totalPages > 1 && !loading && !error && (
          <div className="flex justify-center gap-2 py-4">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 text-sm font-bold rounded-full bg-white border disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-3 py-2 text-sm tabular-nums">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-sm font-bold rounded-full bg-white border disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </RedditLayout>
  );
}
