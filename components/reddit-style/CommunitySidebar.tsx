import { Suspense } from "react";
import Link from "next/link";
import AdSenseSlot from "@/components/ads/AdSenseSlot";
import MentorCtaBox from "@/components/mentors/MentorCtaBox";
import { getCategoryMeta, REDDIT_CATEGORIES } from "@/lib/forum/reddit-categories";
import type { StudyKoreaPostRow } from "@/lib/forum/queries";
type Props = {
  category?: string;
  relatedPosts?: StudyKoreaPostRow[];
};

export default function CommunitySidebar({ category, relatedPosts = [] }: Props) {
  const meta = category ? getCategoryMeta(category) : null;

  return (
    <aside className="space-y-4">
      <Suspense fallback={null}>
        <MentorCtaBox />
      </Suspense>
      <AdSenseSlot format="rectangle" className="mb-4" />

      <div className="bg-white dark:bg-[#1A1A1B] border border-[#EDEFF1] dark:border-[#343536] rounded overflow-hidden">
        <div className="h-12 bg-gradient-to-r from-[#FF4500] to-[#FF8717]" />
        <div className="p-3">
          <h2 className="font-bold text-[#1C1C1C] dark:text-[#D7DADC]">
            {meta ? `About r/${meta.label}` : "About Study Korea"}
          </h2>
          <p className="mt-2 text-sm text-[#7C7C7C] dark:text-[#818384] leading-relaxed">
            {meta?.description ??
              "Curated tips for international students studying in Korea — visa, admissions, scholarships, and campus life."}
          </p>
          <div className="mt-3 flex gap-4 text-xs font-bold text-[#7C7C7C]">
            <span>Members 1.2k</span>
            <span>Online 42</span>
          </div>
          <button
            type="button"
            className="mt-3 w-full py-1.5 rounded-full bg-[#FF4500] text-white text-sm font-bold hover:bg-[#e03d00]"
          >
            Join (soon)
          </button>
        </div>
      </div>

      {relatedPosts.length > 0 && (
        <div className="bg-white dark:bg-[#1A1A1B] border border-[#EDEFF1] dark:border-[#343536] rounded p-3">
          <h3 className="text-sm font-bold text-[#1C1C1C] dark:text-[#D7DADC] mb-2">
            Related posts
          </h3>
          <ul className="space-y-2 text-sm">
            {relatedPosts.map((p) => (
              <li key={p.id}>
                <Link
                  href={
                    p.slug
                      ? `/r/${category ?? p.category}/${p.slug}`
                      : p.url
                  }
                  className="text-[#1C1C1C] dark:text-[#D7DADC] hover:text-[#FF4500] line-clamp-2"
                >
                  {p.ai_title_en || p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white dark:bg-[#1A1A1B] border border-[#EDEFF1] dark:border-[#343536] rounded p-3">
        <h3 className="text-sm font-bold mb-2">Communities</h3>
        <ul className="space-y-1 text-sm">
          {REDDIT_CATEGORIES.slice(0, 5).map((c) => (
            <li key={c.id}>
              <Link href={`/r/${c.id}`} className="hover:text-[#FF4500]">
                {c.emoji} r/{c.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
