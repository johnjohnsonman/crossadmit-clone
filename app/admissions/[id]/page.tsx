import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getAdmissionById } from "@/lib/supabase/admissions-service";
import { admissionToRecord } from "@/lib/supabase/map";
import type { AdmissionSchoolRecord } from "@/lib/types";
import StructuredData from "@/components/StructuredData";
import CommentSection from "@/components/CommentSection";

type PageProps = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? null : n;
}

function schoolBadge(s: AdmissionSchoolRecord): {
  label: string;
  className: string;
} {
  if (s.isRegist) {
    return {
      label: "등록",
      className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }
  if (s.isAccept) {
    return {
      label: "합격",
      className: "border-blue-200 bg-blue-50 text-blue-800",
    };
  }
  return {
    label: "불합격",
    className: "border-gray-200 bg-gray-100 text-gray-600",
  };
}

function dash(v: string | null | undefined): string {
  if (v === null || v === undefined || String(v).trim() === "") return "-";
  return String(v);
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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: record.title,
    description: record.title,
    inLanguage: "ko",
    author: { "@type": "Person", name: record.userHandle },
    datePublished: record.createdAt.toISOString(),
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

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5">
              {record.year}년
            </span>
            {primaryType ? (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5">
                {primaryType}
              </span>
            ) : null}
            {record.isFeatured ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                ⭐ 오늘의 DB
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 text-xl font-bold text-gray-900 sm:text-2xl">
            {record.title}
          </h1>
          <p className="mt-3 text-sm text-gray-500">{record.userHandle}</p>
        </div>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-sage-800">지원 · 합격 학교</h2>
          <ul className="mt-4 space-y-3">
            {record.admissionSchools.map((s) => {
              const badge = schoolBadge(s);
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3 last:border-0"
                >
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  <span className="font-semibold text-gray-900">{s.univName}</span>
                  <span className="text-sm text-gray-700">{s.deptName}</span>
                  {s.admissionType ? (
                    <span className="text-xs text-gray-500">({s.admissionType})</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-medium text-gray-500">수능/표준 점수</h2>
            <p className="mt-2 text-sm text-gray-900">{dash(record.inputScore)}</p>
          </section>
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-medium text-gray-500">내신 / GPA</h2>
            <p className="mt-2 text-sm text-gray-900">{dash(record.inputGpa)}</p>
          </section>
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-medium text-gray-500">특기 · 비교과</h2>
            <p className="mt-2 text-sm text-gray-900">{dash(record.inputSpecialty)}</p>
          </section>
        </div>

        {record.admissionSchools.some((s) => s.review?.trim()) ? (
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">후기</h2>
            {record.admissionSchools
              .filter((s) => s.review?.trim())
              .map((s) => (
                <div key={s.id} className="mt-4">
                  <h3 className="text-sm font-medium text-tea-800">
                    {s.univName} {s.deptName}
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                    {s.review}
                  </p>
                </div>
              ))}
          </section>
        ) : null}

        <section className="mt-6">
          <CommentSection admissionId={id} />
        </section>
      </div>
    </main>
  );
}
