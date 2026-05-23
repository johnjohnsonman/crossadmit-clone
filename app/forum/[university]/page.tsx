"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import StudyForumBoard from "@/components/forum/StudyForumBoard";
import { FORUM_UNIVERSITY_OPTIONS, SLUG_NAME_HINTS } from "@/lib/forum/constants";
import { getDictionary } from "@/lib/i18n/dictionary";
import { resolveLocale, withLang } from "@/lib/i18n/locale";

type UnivInfo = {
  name_kr: string;
  name_en: string;
  country?: string;
};

export default function UniversityForumPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = resolveLocale(searchParams.get("lang"));
  const dict = getDictionary(locale);
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
        <Link
          href={withLang("/forum", locale)}
          className="text-tea-600 hover:underline"
        >
          ← {dict.forum_title}
        </Link>
      </main>
    );
  }

  const searchHint = SLUG_NAME_HINTS[slug]?.[0] ?? label;
  const admissionsHref = withLang(
    `/admissions?search=${encodeURIComponent(searchHint)}`,
    locale
  );

  return (
    <>
      <div className="bg-white border-b border-sage-200">
        <div className="container mx-auto px-4 py-3 max-w-5xl">
          <Link
            href={withLang("/forum", locale)}
            className="text-sm text-gray-600 hover:text-tea-600"
          >
            ← {dict.forum_title}
          </Link>
        </div>
      </div>
      {loading ? (
        <p className="text-center py-12 text-gray-600">{dict.loading}</p>
      ) : (
        <StudyForumBoard
          locale={locale}
          dict={dict}
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
