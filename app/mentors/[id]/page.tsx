import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";
import MentorCard from "@/components/mentors/MentorCard";
import MentorIntroPanel from "@/components/mentors/MentorIntroPanel";
import MentorRequestButton from "@/components/mentors/MentorRequestButton";
import { ViewTracker } from "@/components/mentors/ViewTracker";
import {
  mentorStudentStatusLabel,
  mentorTagsFlat,
  mentorUniversityName,
  isMentorFree,
  tagTypeLabel,
} from "@/lib/mentors/display";
import { getMentorById, getSimilarMentors } from "@/lib/mentors/queries";
import { SITE_URL } from "@/lib/seo/constants";
import { seoAlternates, seoOpenGraph, seoTwitter } from "@/lib/seo/metadata";

const BASE = SITE_URL;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const mentor = await getMentorById(id);
  if (!mentor) return { title: "Mentor not found" };

  const uni =
    mentor.university?.name_en || mentor.university_name_freetext || "Korean University";
  const title = `${mentor.nickname} - ${uni} Mentor`;
  const description = (mentor.intro_en || mentor.intro_kr || "").slice(0, 160);

  return {
    title,
    description,
    alternates: seoAlternates(`/mentors/${id}`),
    openGraph: seoOpenGraph({
      title: `${mentor.nickname} | ${uni} Mentor`,
      description,
      type: "profile",
      url: `${BASE}/mentors/${id}`,
    }),
    twitter: seoTwitter(title, description),
  };
}

export default async function MentorDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const locale = sp.lang === "en" ? "en" : "ko";

  const mentor = await getMentorById(id);
  if (!mentor) notFound();

  const similar = await getSimilarMentors(mentor, 3);
  const tags = mentorTagsFlat(mentor);
  const tagsByType = new Map<number, typeof tags>();
  for (const t of tags) {
    const list = tagsByType.get(t.tag_type) ?? [];
    list.push(t);
    tagsByType.set(t.tag_type, list);
  }

  const memberSince = mentor.legacy_created_at ?? mentor.created_at;
  const memberDate = memberSince
    ? new Date(memberSince).toLocaleDateString(locale === "en" ? "en-US" : "ko-KR", {
        year: "numeric",
        month: "short",
      })
    : "—";

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: mentor.nickname,
    description: (mentor.intro_en || mentor.intro_kr || "").slice(0, 300),
    jobTitle: mentor.student_status === "graduated" ? "Graduate" : "Student",
    url: `${BASE}/mentors/${id}`,
    ...(mentor.university && {
      affiliation: {
        "@type": "CollegeOrUniversity",
        name: mentor.university.name_en || mentor.university.name_kr,
      },
    }),
  };

  return (
    <div className="min-h-screen bg-[#DAE0E6] dark:bg-[#030303]">
      <ViewTracker mentorId={id} />
      <StructuredData data={personSchema} />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <nav className="text-xs text-[#7C7C7C] mb-4">
          <Link href="/" className="hover:underline">
            Home
          </Link>
          <span className="mx-1">›</span>
          <Link href="/mentors" className="hover:underline">
            Mentors
          </Link>
          <span className="mx-1">›</span>
          <span>{mentor.nickname}</span>
        </nav>

        <article className="bg-white dark:bg-[#1A1A1B] border border-[#EDEFF1] dark:border-[#343536] rounded-lg overflow-hidden">
          <div className="p-6 border-b border-[#EDEFF1] dark:border-[#343536]">
            <div className="flex flex-wrap items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
                {mentor.nickname.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-[#1C1C1C] dark:text-[#D7DADC]">
                    {mentor.nickname}
                  </h1>
                  {mentor.is_legacy && (
                    <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 px-2 py-0.5 rounded font-semibold">
                      ⭐ Legacy
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[#7C7C7C] dark:text-[#818384]">
                  {mentor.university?.logo ? (
                    <span className="mr-2">🏫</span>
                  ) : null}
                  {mentorUniversityName(mentor, locale)}
                  {mentorStudentStatusLabel(mentor.student_status, locale)
                    ? ` · ${mentorStudentStatusLabel(mentor.student_status, locale)}`
                    : ""}
                </p>
                <p className="text-xs text-[#7C7C7C] mt-1">
                  {locale === "en" ? "Member since" : "가입"} {memberDate}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/30 p-4">
              <h2 className="text-sm font-bold text-purple-900 dark:text-purple-200 mb-2">
                Mentoring rates
              </h2>
              <div className="flex flex-wrap gap-4 text-sm">
                {mentor.offers_admission && (
                  <span className="text-blue-700 dark:text-blue-300 font-semibold">
                    🎓 Admission: ${Number(mentor.price_admission_usd)}/hr
                  </span>
                )}
                {mentor.offers_career && (
                  <span className="text-green-700 dark:text-green-300 font-semibold">
                    💼 Career: ${Number(mentor.price_career_usd)}/hr
                  </span>
                )}
                {isMentorFree(mentor) && (
                  <span className="text-amber-700 dark:text-amber-300 font-semibold">
                    🎁 Free Volunteer
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <MentorIntroPanel
              introKr={mentor.intro_kr}
              introEn={mentor.intro_en}
              locale={locale}
            />

            {tags.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-bold text-[#1C1C1C] dark:text-[#D7DADC] mb-3">
                  Specialties
                </h2>
                <div className="space-y-3">
                  {[...tagsByType.entries()].map(([type, list]) => (
                    <div key={type}>
                      <p className="text-xs font-bold text-[#7C7C7C] mb-1">
                        {tagTypeLabel(type, locale)}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {list.map((t) => (
                          <span
                            key={t.id}
                            className={`text-xs px-2 py-1 rounded ${
                              type === 3
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                                : type === 4
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                                  : type === 2
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {locale === "en" ? t.tag_en : t.tag_kr}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg bg-[#F6F7F8] dark:bg-[#272729] p-3">
                <p className="text-xs text-[#7C7C7C]">Service time</p>
                <p className="font-semibold text-[#1C1C1C] dark:text-[#D7DADC]">
                  {mentor.service_time || "—"}
                </p>
              </div>
              <div className="rounded-lg bg-[#F6F7F8] dark:bg-[#272729] p-3">
                <p className="text-xs text-[#7C7C7C]">Member since</p>
                <p className="font-semibold text-[#1C1C1C] dark:text-[#D7DADC]">
                  {memberDate}
                </p>
              </div>
              <div className="rounded-lg bg-[#F6F7F8] dark:bg-[#272729] p-3">
                <p className="text-xs text-[#7C7C7C]">Views</p>
                <p className="font-semibold text-[#1C1C1C] dark:text-[#D7DADC]">
                  {Number(mentor.view_count).toLocaleString()}
                </p>
              </div>
            </section>

            <MentorRequestButton />
          </div>
        </article>

        {similar.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-[#1C1C1C] dark:text-[#D7DADC] mb-4">
              Similar mentors
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {similar.map((m) => (
                <MentorCard key={m.id} mentor={m} locale={locale} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
