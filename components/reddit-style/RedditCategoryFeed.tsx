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

export default function RedditCategoryFeed({
  categoryId,
  categoryMeta,
  sort,
}: Props) {
  const [posts, setPosts] = useState<RedditPostCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
      category: categoryId,
      sort: sort === "latest" ? "new" : sort,
    });
    const res = await fetch(`/api/forum?${params}`);
    const json = await res.json();
    if (res.ok) {
      setPosts(json.posts ?? []);
      setTotal(json.total ?? 0);
    }
    setLoading(false);
  }, [page, sort, categoryId]);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

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
          className="mt-3 px-4 py-1 rounded-full border-2 border-[#FF4500] text-[#FF4500] text-sm font-bold"
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
        ) : (
          posts.map((p, i) => (
            <div key={p.id}>
              {i === 4 && (
                <div className="my-2">
                  <AdSenseSlot />
                </div>
              )}
              <PostCard post={p} />
            </div>
          ))
        )}
        {totalPages > 1 && !loading && (
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
