"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import AdSenseSlot from "@/components/ads/AdSenseSlot";
import PostCard, { type RedditPostCardData } from "./PostCard";
import RedditLayout from "./RedditLayout";
import SortTabs from "./SortTabs";
import CommunitySidebar from "./CommunitySidebar";
import ForumFeedTabs from "./ForumFeedTabs";
import ForumEmptyState from "./ForumEmptyState";
import CreatePostButton from "./CreatePostButton";
import type { ForumFeedKind } from "@/lib/forum/feed-kind";

const PAGE_SIZE = 20;

function parseTab(raw: string | null): ForumFeedKind {
  if (raw === "guides" || raw === "news") return raw;
  return "discussions";
}

export default function RedditForumHome() {
  const searchParams = useSearchParams();
  const sort = searchParams.get("sort") || "hot";
  const tab = parseTab(searchParams.get("tab"));
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
      kind: tab,
    });
    const res = await fetch(`/api/forum?${params}`);
    const json = await res.json();
    if (res.ok) {
      setPosts(json.posts ?? []);
      setTotal(json.total ?? 0);
    }
    setLoading(false);
  }, [page, sort, tab]);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    setPage(0);
  }, [sort, tab]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const sectionLabel =
    tab === "guides"
      ? "📚 Guides"
      : tab === "news"
        ? "📰 News"
        : "💬 Discussions";

  return (
    <RedditLayout sort={sort} rightSidebar={<CommunitySidebar />}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <ForumFeedTabs active={tab} sort={sort} />
        </div>
        <CreatePostButton className="sm:hidden shrink-0" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
        <SortTabs sort={sort} />
        <CreatePostButton className="hidden sm:inline-flex" />
      </div>

      {tab === "guides" && (
        <p className="text-xs text-orange-700 dark:text-orange-400 px-1 mb-2">
          AI-generated · factual guides for international students
        </p>
      )}

      <div className="bg-[#DAE0E6] dark:bg-[#030303] space-y-2 pt-2">
        {!loading && posts.length > 0 && (
          <h2 className="text-sm font-bold text-[#1C1C1C] dark:text-[#D7DADC] px-1">
            {sectionLabel}
          </h2>
        )}

        {loading ? (
          <div className="p-8 text-center text-sm text-[#7C7C7C] bg-white dark:bg-[#1A1A1B] rounded border border-[#EDEFF1]">
            Loading posts…
          </div>
        ) : posts.length === 0 ? (
          <ForumEmptyState kind={tab} />
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

        {totalPages > 1 && !loading && posts.length > 0 && (
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
