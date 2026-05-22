import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getAdmissionById,
  getAdmissions,
} from "@/lib/supabase/admissions-service";
import { admissionToRecord } from "@/lib/supabase/map";
import type { AdmissionSchoolRecord } from "@/lib/types";
import StructuredData from "@/components/StructuredData";
import CommentSection from "@/components/CommentSection";
import { formatText, formatTextWithLineBreaks } from "@/lib/utils/format-text";
import StatusBadge, { statusFromFlags } from "@/components/ui/StatusBadge";
import AdmissionDetailSidebar from "@/components/admissions/AdmissionDetailSidebar";
import AdmissionLikeButton from "@/components/admissions/AdmissionLikeButton";
import AdmissionShareButton from "@/components/admissions/AdmissionShareButton";

type PageProps = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

function SpecBlock({
  title,
  content,
}: {
  title: string;
  content: string | undefined;
}) {
  const has =
    content?.trim() && formatText(content) !== "-";
  return (
    <div className="rounded-lg bg-[#F9F9F7] p-4 sm:p-5">
      <h3 className="text-xs font-medium text-[#6B7280] tracking-wide">
        {title}
      </h3>
      <div className="mt-3 text-sm leading-relaxed text-[#1A1A1A]">
        {has ? (
          formatTextWithLineBreaks(content)
        ) : (
          <span className="text-[#9CA3AF]">정보 없음</span>
        )}
      </div>
    </div>
  );
}

function ResultRow({ school }: { school: AdmissionSchoolRecord }) {
  const status = statusFromFlags(school.isRegist, school.isAccept);
  const symbol =
    status === "enroll" ? "●" : status === "accept" ? "○" : "✕";
  return (
    <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5 border-b border-[#E5E5E0]/80 last:border-0">
      <span className="w-16 shrink-0 flex items-center gap-1.5">
        <span
          className={
            status === "enroll"
              ? "text-[#2D5A27]"
              : status === "accept"
                ? "text-blue-600"
                : "text-[#9CA3AF]"
          }
          aria-hidden
        >
          {symbol}
        </span>
        <StatusBadge status={status} variant="pill" />
      </span>
      <span
        className={`font-semibold ${status === "reject" ? "text-[#9CA3AF] line-through" : "text-[#1A1A1A]"}`}
      >
        {school.univName}
      </span>
      <span
        className={`text-sm ${status === "reject" ? "text-[#9CA3AF] line-through" : "text-[#6B7280]"}`}
      >
        {school.deptName}
      </span>
    </li>
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: idRaw } = await params;
  const id = parseId(idRaw);
  if (id === null) {
    return { title: "합격자 정보를 찾을 수 없습니다 | 크로스어드밋" };
  }
  try {
    const row = await getAdmissionById(id);
    if (!row) {
      return { title: "합격자 정보를 찾을 수 없습니다 | 크로스어드밋" };
    }
    const regist = row.admission_schools?.find((s) => s.is_regist);
    const title = regist
      ? `${regist.univ_name} ${regist.dept_name} | ${row.year}년 합격DB`
      : `${row.title} | ${row.year}년 합격DB`;
    return {
      title,
      description: row.title ?? `${row.year}년 합격 후기`,
      openGraph: {
        title,
        type: "article",
        url: `https://crossadmit.com/admissions/${id}`,
      },
    };
  } catch {
    return { title: "합격DB | 크로스어드밋" };
  }
}

export default async function AdmissionDetailPage({ params }: PageProps) {
  const { id: idRaw } = await params;
  const id = parseId(idRaw);
  if (id === null) notFound();

  let row;
  try {
    row = await getAdmissionById(id);
  } catch (e) {
    console.error("getAdmissionById:", e);
    throw e;
  }

  if (!row) notFound();

  const record = admissionToRecord(row);
  const primaryType =
    record.admissionSchools.find((s) => s.isRegist)?.admissionType ||
    record.admissionSchools[0]?.admissionType ||
    "";

  const registSchool = record.admissionSchools.find((s) => s.isRegist);
  let related = typeof registSchool?.univName === "string"
    ? (
        await getAdmissions({
          search: registSchool.univName,
          limit: 8,
          offset: 0,
          sort: "latest",
        })
      ).data
        .filter((r) => r.id !== id)
        .slice(0, 5)
        .map(admissionToRecord)
    : [];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: record.title,
    description: record.title,
    inLanguage: "ko",
    author: { "@type": "Person", name: record.userHandle },
    datePublished: record.createdAt.toISOString(),
  };

  const reviews = record.admissionSchools.filter((s) => s.review?.trim());

  return (
    <main className="min-h-screen bg-[#FAFAF8]">
      <StructuredData data={structuredData} />

      <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Link
          href="/admissions"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#6B7280] hover:text-[#2D5A27] transition-colors"
        >
          ← 목록으로
        </Link>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <header className="rounded-xl border border-[#E5E5E0] bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg sm:text-xl font-semibold tracking-tight text-[#1A1A1A]">
                    {record.year}년 {primaryType}
                  </p>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    {record.userHandle?.trim() || "익명"}
                  </p>
                  {record.isFeatured && (
                    <span className="mt-2 inline-block text-xs font-medium text-[#2D5A27] bg-[#EBF5EB] px-2 py-0.5 rounded">
                      추천 후기
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <AdmissionLikeButton
                    admissionId={id}
                    initialCount={record.likesCount ?? 0}
                    variant="detail"
                  />
                  <AdmissionShareButton title={record.title} />
                </div>
              </div>
            </header>

            <section className="rounded-xl border border-[#E5E5E0] bg-white p-5 sm:p-6 shadow-sm">
              <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A]">
                지원 결과
              </h2>
              <ul className="mt-3">
                {record.admissionSchools.map((s) => (
                  <ResultRow key={s.id} school={s} />
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A] mb-3">
                스펙
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SpecBlock title="수능/시험 점수" content={record.inputScore} />
                <SpecBlock title="내신 / GPA" content={record.inputGpa} />
                <SpecBlock
                  title="비교과/특기"
                  content={record.inputSpecialty}
                />
              </div>
            </section>

            {reviews.length > 0 && (
              <section className="rounded-xl border border-[#E5E5E0] bg-white p-5 sm:p-6 shadow-sm">
                <h2 className="text-sm font-semibold tracking-tight text-[#1A1A1A]">
                  후기
                </h2>
                <div className="mt-4 space-y-5">
                  {reviews.map((s) => (
                    <div key={s.id}>
                      <h3 className="text-xs font-medium text-[#6B7280]">
                        {s.univName} · {s.deptName}
                      </h3>
                      <div className="mt-2 text-sm leading-relaxed text-[#1A1A1A]">
                        {formatTextWithLineBreaks(s.review)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-xl border border-[#E5E5E0] bg-white p-5 sm:p-6 shadow-sm">
              <CommentSection admissionId={id} />
            </section>
          </div>

          <div className="lg:col-span-1">
            <AdmissionDetailSidebar record={record} related={related} />
          </div>
        </div>
      </div>
    </main>
  );
}
