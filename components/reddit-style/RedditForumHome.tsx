"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdSenseSlot from "@/components/ads/AdSenseSlot";
import PostCard, { type RedditPostCardData } from "./PostCard";
import RedditLayout from "./RedditLayout";
import SortTabs from "./SortTabs";
import CommunitySidebar from "./CommunitySidebar";

const PAGE_SIZE = 20;

export default function RedditForumHome() {
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") || "hot";
  const [posts, setPosts] = useState<RedditPostCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
      sort: sort === "latest" ? "new" : sort,
    });
    const res = await fetch(`/api/forum?${params}`);
    const json = await res.json();
    if (res.ok) {
      setPosts(json.posts ?? []);
      setTotal(json.total ?? 0);
    }
    setLoading(false);
  }, [page, sort]);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    setPage(0);
  }, [sort]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <RedditLayout
      sort={sort}
      rightSidebar={<CommunitySidebar />}
    >
      <SortTabs sort={sort} />
      <div className="bg-[#DAE0E6] dark:bg-[#030303] space-y-2 pt-2">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#7C7C7C] bg-white dark:bg-[#1A1A1B] rounded border border-[#EDEFF1]">
            Loading posts…
          </div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#7C7C7C] bg-white dark:bg-[#1A1A1B] rounded border border-[#EDEFF1]">
            No posts yet. Check back after the next crawl.
          </div>
        ) : (
          posts.map((p, i) => (
            <div key={p.id}>
              {i === 4 && (
                <div className="my-2">
                  <AdSenseSlot format="auto" />
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
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-4 py-2 text-sm font-bold rounded-full bg-white dark:bg-[#1A1A1B] border border-[#EDEFF1] disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-3 py-2 text-sm text-[#7C7C7C] tabular-nums">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-sm font-bold rounded-full bg-white dark:bg-[#1A1A1B] border border-[#EDEFF1] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </RedditLayout>
  );
}
