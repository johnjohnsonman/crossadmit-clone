import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import type { AdmissionRecord } from "@/lib/types";
import { getAdmissionById } from "@/lib/supabase/admissions-service";
import { rowToAdmissionRecord } from "@/lib/supabase/map";
import StructuredData from "@/components/StructuredData";

type PageProps = { params: Promise<{ id: string }> };

function statusBadgeClasses(status: string): string {
  if (status === "등록") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "합격") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }
  if (status === "불합격") {
    return "border-red-200 bg-red-50 text-red-800";
  }
  if (status === "대기중") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }
  return "border-gray-200 bg-gray-100 text-gray-700";
}

function dash(v: string | null | undefined): string {
  if (v === null || v === undefined || String(v).trim() === "") return "-";
  return String(v);
}

function renderJsonish(value: unknown): ReactNode {
  if (value === null || value === undefined) return "-";
  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value as object).length === 0
  ) {
    return "-";
  }
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return (
    <pre className="mt-1 max-h-48 overflow-auto rounded border border-gray-100 bg-gray-50 p-3 text-xs text-gray-800">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function splitUniversities(text: string): string[] {
  return text
    .split(/,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function narrativeBody(record: AdmissionRecord): string | undefined {
  const s = record.summary?.trim();
  if (s) return s;
  const r = record.rawContent?.trim();
  if (r) return r;
  const legacy = record.review?.trim();
  if (legacy) return legacy;
  return undefined;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const row = await getAdmissionById(id);
    if (!row) {
      return { title: "합격자 정보를 찾을 수 없습니다 | 크로스어드밋" };
    }
    const title = `${row.university} ${row.major} | ${row.year}년 합격DB`;
    const description = `${row.university} ${row.major} · ${row.year}년도 ${row.admission_type} · ${row.status}`;
    return {
      title,
      description,
      openGraph: { title, description, type: "article", url: `https://crossadmit.com/admissions/${id}` },
    };
  } catch {
    return { title: "합격DB | 크로스어드밋" };
  }
}

export default async function AdmissionDetailPage({ params }: PageProps) {
  const { id } = await params;

  let row;
  try {
    row = await getAdmissionById(id);
  } catch (e) {
    console.error("getAdmissionById:", e);
    throw e;
  }

  if (!row) {
    notFound();
  }

  const record = rowToAdmissionRecord(row);
  const username = record.username?.trim() || "익명";
  const schools = splitUniversities(record.university);
  const bodyText = narrativeBody(record);
  const langProf = record.languageProficiency as unknown;
  const gpa = record.gpa;
  const testScores = record.testScores;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${record.university} ${record.major} 합격 정보`,
    description: bodyText?.slice(0, 200) ?? `${record.year}년도 ${record.admissionType}`,
    inLanguage: "ko",
    author: { "@type": "Person", name: username },
    datePublished: record.createdAt.toISOString(),
    about: {
      "@type": "EducationalOrganization",
      name: record.university,
      alternateName: record.universityEn,
    },
  };

  return (
    <main className="min-h-screen bg-[#f5f4f0]">
      <StructuredData data={structuredData} />

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/admissions"
          className="inline-flex items-center gap-1 text-sm font-medium text-tea-700 hover:text-tea-900"
        >
          ← 합격DB 목록
        </Link>

        {/* 헤더 */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5">
              {record.year}년
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5">
              {record.admissionType}
            </span>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(record.status)}`}
            >
              {record.status}
            </span>
          </div>

          <h1 className="mt-4 text-xl font-bold text-gray-900 sm:text-2xl">
            {schools.map((u) => (
              <span key={u} className="mr-2 inline-block">
                {u}
              </span>
            ))}
          </h1>
          <p className="mt-1 text-base text-gray-700">{record.major}</p>
          <p className="mt-3 text-sm text-gray-500">{username}</p>
        </div>

        {/* 2열 정보 */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-sage-800">테스트 스코어 · 내신</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-gray-500">GPA / 내신</dt>
                <dd className="mt-1 text-gray-900">
                  {gpa?.unweighted || gpa?.weighted ? (
                    <ul className="list-inside list-disc space-y-1">
                      {gpa.unweighted ? <li>unweighted: {gpa.unweighted}</li> : null}
                      {gpa.weighted ? <li>weighted: {gpa.weighted}</li> : null}
                      {gpa.ap && gpa.ap.length > 0 ? (
                        <li>AP: {gpa.ap.join(", ")}</li>
                      ) : null}
                      {gpa.dualEnrollment ? <li>{gpa.dualEnrollment}</li> : null}
                    </ul>
                  ) : (
                    "-"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">표준화/기타 시험 (test_scores)</dt>
                <dd className="mt-1 text-gray-900">{renderJsonish(testScores)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">TOPIK</dt>
                <dd className="mt-1 text-gray-900">{dash(record.topikLevel)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-sage-800">스펙 요약</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-gray-500">국적</dt>
                <dd className="mt-1 text-gray-900">{dash(record.nationality)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">비자 유형</dt>
                <dd className="mt-1 text-gray-900">{dash(record.visaType)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">어학 / 언어 능력</dt>
                <dd className="mt-1 text-gray-900">{renderJsonish(langProf)}</dd>
              </div>
            </dl>
          </section>
        </div>

        {/* 후기 */}
        {(record.pros?.length ||
          record.cons?.length ||
          record.tips?.length ||
          bodyText) ? (
          <section className="mt-6 space-y-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">후기</h2>

            {record.pros && record.pros.length > 0 ? (
              <div>
                <h3 className="text-sm font-medium text-tea-800">좋았던 점</h3>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-800">
                  {record.pros.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {record.cons && record.cons.length > 0 ? (
              <div>
                <h3 className="text-sm font-medium text-amber-800">어려웠던 점</h3>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-800">
                  {record.cons.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {record.tips && record.tips.length > 0 ? (
              <div>
                <h3 className="text-sm font-medium text-sage-800">후배 팁</h3>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-800">
                  {record.tips.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {bodyText ? (
              <div>
                <h3 className="text-sm font-medium text-gray-800">상세 후기</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                  {bodyText}
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* 댓글 placeholder */}
        <section className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">댓글 기능 준비 중입니다</p>
        </section>
      </div>
    </main>
  );
}
