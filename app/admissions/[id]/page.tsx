import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getAdmissionById } from "@/lib/supabase/admissions-service";
import StructuredData from "@/components/StructuredData";
import CommentSection from "@/components/CommentSection";

type PageProps = { params: Promise<{ id: string }> };

function statusBadgeClasses(status: "등록" | "합격" | "불합격"): string {
  if (status === "등록") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "합격") return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-gray-200 bg-gray-100 text-gray-700";
}

function schoolStatus(s: {
  is_regist: boolean;
  is_accept: boolean;
  is_apply: boolean;
}): "등록" | "합격" | "불합격" {
  if (s.is_regist) return "등록";
  if (s.is_accept) return "합격";
  if (s.is_apply) return "불합격";
  return "불합격";
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) {
    return { title: "합격DB | 크로스어드밋" };
  }
  try {
    const row = await getAdmissionById(numId);
    if (!row) {
      return { title: "합격자 정보를 찾을 수 없습니다 | 크로스어드밋" };
    }
    const reg = row.admission_schools?.find((s) => s.is_regist);
    const title = reg
      ? `${reg.univ_name} ${reg.dept_name} | ${row.year}년 합격DB`
      : `${row.year}년 합격DB`;
    return { title, description: row.title || title };
  } catch {
    return { title: "합격DB | 크로스어드밋" };
  }
}

export default async function AdmissionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (Number.isNaN(numId)) notFound();

  const admission = await getAdmissionById(numId);
  if (!admission) notFound();

  const schools = admission.admission_schools ?? [];

  return (
    <main className="min-h-screen bg-[#f5f4f0]">
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: admission.title || `${admission.year}년 합격 정보`,
          author: { "@type": "Person", name: admission.user_handle },
          datePublished: admission.created_at,
        }}
      />

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/admissions"
          className="text-sm font-medium text-tea-700 hover:text-tea-900"
        >
          ← 합격DB 목록
        </Link>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5">
              {admission.year}년
            </span>
            {admission.is_featured ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-amber-900">
                ⭐ 오늘의 DB
              </span>
            ) : null}
            {admission.is_verified ? (
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-teal-900">
                인증
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            {admission.title || `${admission.year}년 합격 정보`}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{admission.user_handle}</p>

          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium text-gray-500">성적/점수</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
                {admission.input_score || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">내신/GPA</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
                {admission.input_gpa || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">특기/활동</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
                {admission.input_specialty || "—"}
              </dd>
            </div>
          </dl>
        </div>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">지원·합격·등록 학교</h2>
          <ul className="mt-4 space-y-4">
            {schools.map((s) => {
              const st = schoolStatus(s);
              return (
                <li
                  key={s.id}
                  className="rounded-lg border border-gray-100 bg-gray-50/80 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {s.univ_name} · {s.dept_name}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(st)}`}
                    >
                      {st}
                    </span>
                    {s.admission_type ? (
                      <span className="text-xs text-gray-500">{s.admission_type}</span>
                    ) : null}
                  </div>
                  {s.review?.trim() ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                      {s.review}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-6">
          <CommentSection admissionId={String(numId)} />
        </section>
      </div>
    </main>
  );
}
