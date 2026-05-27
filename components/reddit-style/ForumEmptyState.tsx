import Link from "next/link";
import type { ForumFeedKind } from "@/lib/forum/feed-kind";
import CreatePostButton from "./CreatePostButton";

type Props = {
  kind: ForumFeedKind;
  category?: string;
};

const COPY: Record<
  ForumFeedKind,
  { title: string; body: string; showCreate: boolean }
> = {
  discussions: {
    title: "Be the first to share your story",
    body: "Questions, tips, and experiences from international students in Korea — no signup required.",
    showCreate: true,
  },
  guides: {
    title: "No guides here yet",
    body: "AI-generated factual guides for this section are on the way. Check other categories or the News tab.",
    showCreate: false,
  },
  news: {
    title: "No news in this feed yet",
    body: "Official updates and headlines from Korea study channels will appear here after the next crawl.",
    showCreate: false,
  },
};

export default function ForumEmptyState({ kind, category }: Props) {
  const { title, body, showCreate } = COPY[kind];

  return (
    <div className="p-8 text-center bg-white dark:bg-[#1A1A1B] rounded border border-[#EDEFF1] dark:border-[#343536]">
      <p className="text-base font-bold text-[#1C1C1C] dark:text-[#D7DADC] mb-2">
        {title}
      </p>
      <p className="text-sm text-[#7C7C7C] dark:text-[#818384] max-w-md mx-auto mb-5">
        {body}
      </p>
      {showCreate && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <CreatePostButton category={category} className="px-5 py-2 text-sm" />
          <Link
            href="/forum?tab=news"
            className="text-sm font-bold text-[#FF4500] hover:underline"
          >
            Browse news →
          </Link>
        </div>
      )}
    </div>
  );
}
