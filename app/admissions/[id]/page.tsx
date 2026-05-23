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
  if (!has) return null;
  return (
    <div className="rounded-lg bg-gray-800/50 border border-gray-800 p-4 sm:p-5">
      <h3 className="text-xs font-medium text-gray-400 tracking-wide">
        {title}
      </h3>
      <div className="mt-3 text-sm leading-relaxed text-white">
        {formatTextWithLineBreaks(content)}
      </div>
    </div>
  );
}

/** input_specialty: 첫 줄=어학시험, 이후=비교과 (자동 이관 형식) */
function sourceHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function isAutoCollectedSource(source: string | undefined | null): boolean {
  return (source ?? "").trim() === "auto_collected";
}

function resolveSourceUrl(
  row: { source_url?: string | null },
  record: { sourceUrl?: string }
): string | undefined {
  return record.sourceUrl ?? (row.source_url?.trim() || undefined);
}

function AutoCollectedSourceLink({ url }: { url: string }) {
  return (
    <div className="mt-4 pt-3 border-t border-gray-800 text-xs text-gray-500">
      🔗 원본 출처:{" "}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="ml-1 text-gray-400 hover:text-orange-400 underline"
      >
        {sourceHostname(url)}
      </a>
      <span className="ml-2 text-gray-600">(자동 수집)</span>
    </div>
  );
}

function splitInputSpecialty(raw: string | undefined): {
  testScores?: string;
  extraActivities?: string;
} {
  const text = raw?.trim() ?? "";
  if (!text) return {};
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) {
    return { testScores: text };
  }
  return {
    testScores: lines[0],
    extraActivities: lines.slice(1).join("\n"),
  };
}

function ResultRow({ school }: { school: AdmissionSchoolRecord }) {
  const status = statusFromFlags(school.isRegist, school.isAccept);
  const symbol =
    status === "enroll" ? "●" : status === "accept" ? "○" : "✕";
  return (
    <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5 border-b border-gray-800 last:border-0">
      <span className="w-16 shrink-0 flex items-center gap-1.5">
        <span
          className={
            status === "enroll"
              ? "text-green-400"
              : status === "accept"
                ? "text-blue-400"
                : "text-gray-500"
          }
          aria-hidden
        >
          {symbol}
        </span>
        <StatusBadge status={status} variant="pill" />
      </span>
      <span
        className={`font-semibold ${status === "reject" ? "text-gray-500 line-through" : "text-white"}`}
      >
        {school.univName}
      </span>
      <span
        className={`text-sm ${status === "reject" ? "text-gray-500 line-through" : "text-gray-400"}`}
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
  const sourceUrl = resolveSourceUrl(row, record);
  const showSourceLink =
    isAutoCollectedSource(record.source) && Boolean(sourceUrl);
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
  const { testScores, extraActivities } = splitInputSpecialty(
    record.inputSpecialty
  );

  return (
    <main className="min-h-screen bg-gray-950 text-gray-300">
      <StructuredData data={structuredData} />

      <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Link
          href="/admissions"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-orange-400 transition-colors"
        >
          ← 목록으로
        </Link>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <header className="rounded-xl border border-gray-800 bg-gray-900 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg sm:text-xl font-semibold tracking-tight text-white">
                    {record.year}년 {primaryType}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    {record.userHandle?.trim() || "익명"}
                  </p>
                  {record.isFeatured && (
                    <span className="mt-2 inline-block text-xs font-medium text-orange-300 bg-orange-500/20 border border-orange-500/30 px-2 py-0.5 rounded">
                      추천 후기
                    </span>
                  )}
                  {showSourceLink && sourceUrl && (
                    <AutoCollectedSourceLink url={sourceUrl} />
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

            <section className="rounded-xl border border-gray-800 bg-gray-900 p-5 sm:p-6">
              <h2 className="text-sm font-semibold tracking-tight text-white">
                지원 결과
              </h2>
              <ul className="mt-3">
                {record.admissionSchools.map((s) => (
                  <ResultRow key={s.id} school={s} />
                ))}
              </ul>
            </section>

            {(record.inputScore ||
              record.inputGpa ||
              testScores ||
              extraActivities) && (
              <section>
                <h2 className="text-sm font-semibold tracking-tight text-white mb-3">
                  스펙
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SpecBlock title="수능/시험 점수" content={record.inputScore} />
                  <SpecBlock title="내신 / GPA" content={record.inputGpa} />
                  <SpecBlock title="어학 / 표준화 시험" content={testScores} />
                  <SpecBlock title="비교과 / 활동" content={extraActivities} />
                </div>
              </section>
            )}

            {reviews.length > 0 && (
              <section className="rounded-xl border border-gray-800 bg-gray-900 p-5 sm:p-6">
                <h2 className="text-sm font-semibold tracking-tight text-white">
                  후기
                </h2>
                <div className="mt-4 space-y-5">
                  {reviews.map((s) => (
                    <div key={s.id}>
                      <h3 className="text-xs font-medium text-gray-400">
                        {s.univName} · {s.deptName}
                      </h3>
                      <div className="mt-2 text-sm leading-relaxed text-white">
                        {formatTextWithLineBreaks(s.review)}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-xl border border-gray-800 bg-gray-900 p-5 sm:p-6">
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
