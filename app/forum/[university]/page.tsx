"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import StudyForumBoard from "@/components/forum/StudyForumBoard";
import { FORUM_UNIVERSITY_OPTIONS, SLUG_NAME_HINTS } from "@/lib/forum/constants";

type UnivInfo = {
  name_kr: string;
  name_en: string;
  country?: string;
};

export default function UniversityForumPage() {
  const params = useParams();
  const slug = (params.university as string) ?? "";
  const [university, setUniversity] = useState<UnivInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const label =
    FORUM_UNIVERSITY_OPTIONS.find((o) => o.slug === slug)?.label ?? slug;

  useEffect(() => {
    if (!slug || slug === "other") {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const res = await fetch(
          `/api/forum/university-info?slug=${encodeURIComponent(slug)}`
        );
        const json = await res.json();
        if (json.university) {
          setUniversity({
            name_kr: json.university.name_kr,
            name_en: json.university.name_en,
            country: json.university.country,
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (!slug) {
    return (
      <main className="min-h-screen bg-sage-50 flex items-center justify-center text-gray-900">
        <Link href="/forum" className="text-tea-600 hover:underline">
          ← 포럼 목록
        </Link>
      </main>
    );
  }

  const searchHint = SLUG_NAME_HINTS[slug]?.[0] ?? label;
  const admissionsHref = `/admissions?search=${encodeURIComponent(searchHint)}`;

  return (
    <>
      <div className="bg-white border-b border-sage-200">
        <div className="container mx-auto px-4 py-3 max-w-5xl">
          <Link href="/forum" className="text-sm text-gray-600 hover:text-tea-600">
            ← 유학 포럼
          </Link>
        </div>
      </div>
      {loading ? (
        <p className="text-center py-12 text-gray-600">불러오는 중…</p>
      ) : (
        <StudyForumBoard
          locale="ko"
          fixedUniversity={slug}
          showUniversityFilter={false}
          universityInfo={
            university ?? {
              name_kr: label,
              name_en: label,
            }
          }
          admissionsHref={admissionsHref}
        />
      )}
    </>
  );
}
