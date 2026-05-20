"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

const inputClass =
  "mt-1 block w-full rounded-lg border border-[#ddd] bg-white px-3 py-2 text-sm text-gray-900 shadow-sm " +
  "focus:border-tea-600 focus:outline-none focus:ring-2 focus:ring-tea-500/30";
const inputError = "border-red-500 ring-2 ring-red-200 focus:border-red-500 focus:ring-red-200";
const labelClass = "block text-sm font-medium text-gray-800";

const YEAR_OPTIONS = [
  { value: "2025", label: "2025" },
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
  { value: "2021", label: "2021" },
  { value: "2020", label: "2020" },
  { value: "2019", label: "2019" },
  { value: "2018", label: "2019 이전" },
];

const ADMISSION_TYPES = [
  "수시",
  "정시",
  "편입",
  "유학",
  "어학연수",
  "교환학생",
  "기타",
];

const RESULT_OPTIONS = ["합격", "등록", "불합격", "대기중"];

const TOPIK_OPTIONS = [
  { value: "none", label: "없음" },
  { value: "1", label: "1급" },
  { value: "2", label: "2급" },
  { value: "3", label: "3급" },
  { value: "4", label: "4급" },
  { value: "5", label: "5급" },
  { value: "6", label: "6급" },
];

type FieldErrors = Partial<
  Record<
    | "university"
    | "major"
    | "year"
    | "admission_type"
    | "status"
    | "review",
    string
  >
>;

function validate(
  university: string,
  major: string,
  year: string,
  admission_type: string,
  status: string,
  review: string
): FieldErrors {
  const e: FieldErrors = {};
  if (!university.trim()) e.university = "대학교명을 입력해주세요.";
  if (!major.trim()) e.major = "학과를 입력해주세요.";
  if (!year) e.year = "입학 연도를 선택해주세요.";
  if (!admission_type) e.admission_type = "전형 종류를 선택해주세요.";
  if (!status) e.status = "결과를 선택해주세요.";
  if (review.trim().length < 50) {
    e.review = "후기는 최소 50자 이상 입력해주세요.";
  }
  return e;
}

export default function AdmissionNewPage() {
  const router = useRouter();
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("");
  const [admissionType, setAdmissionType] = useState("");
  const [status, setStatus] = useState("");
  const [review, setReview] = useState("");
  const [nickname, setNickname] = useState("");
  const [nationality, setNationality] = useState("");
  const [topik, setTopik] = useState("none");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [tips, setTips] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reviewLen = useMemo(() => review.trim().length, [review]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => {
      router.push("/admissions");
    }, 3000);
    return () => clearTimeout(t);
  }, [success, router]);

  const fieldClass = (field: keyof FieldErrors) =>
    `${inputClass} ${errors[field] ? inputError : ""}`;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const v = validate(university, major, year, admissionType, status, review);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admissions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          university: university.trim(),
          major: major.trim(),
          year: parseInt(year, 10),
          admission_type: admissionType,
          status,
          review: review.trim(),
          nickname: nickname.trim(),
          nationality: nationality.trim(),
          topik,
          pros,
          cons,
          tips,
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setFormError(data.error ?? "등록에 실패했습니다.");
        return;
      }
      setSuccess(true);
    } catch {
      setFormError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#f5f4f0] py-12">
        <div className="container mx-auto max-w-lg px-4 text-center">
          <div className="rounded-xl border border-tea-200 bg-white p-8 shadow-sm">
            <p className="text-lg font-semibold text-gray-900">
              후기가 등록되었습니다! 검토 후 게시됩니다. 감사합니다 🎉
            </p>
            <Link
              href="/admissions"
              className="mt-6 inline-flex rounded-lg bg-tea-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-tea-700"
            >
              목록으로 돌아가기
            </Link>
            <p className="mt-4 text-xs text-gray-500">
              잠시 후 목록 페이지로 이동합니다…
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f4f0] pb-16 pt-10">
      <div className="container mx-auto max-w-2xl px-4">
        <Link
          href="/admissions"
          className="text-sm font-medium text-tea-700 hover:text-tea-900 hover:underline"
        >
          ← 합격DB 목록
        </Link>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="text-2xl font-bold text-gray-900">합격 후기 등록</h1>
          <p className="mt-2 text-sm text-gray-600">
            로그인 없이 등록 가능합니다. 허위 정보는 삭제될 수 있습니다.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {formError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {formError}
              </div>
            ) : null}

            <div>
              <label className={labelClass} htmlFor="university">
                대학교명 <span className="text-red-600">*</span>
              </label>
              <input
                id="university"
                type="text"
                className={fieldClass("university")}
                placeholder="예: 서울대학교, Seoul National University"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                autoComplete="off"
              />
              {errors.university ? (
                <p className="mt-1 text-xs text-red-600">{errors.university}</p>
              ) : null}
            </div>

            <div>
              <label className={labelClass} htmlFor="major">
                학과 <span className="text-red-600">*</span>
              </label>
              <input
                id="major"
                type="text"
                className={fieldClass("major")}
                placeholder="예: 컴퓨터공학과, Computer Science"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                autoComplete="off"
              />
              {errors.major ? (
                <p className="mt-1 text-xs text-red-600">{errors.major}</p>
              ) : null}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="year">
                  입학 연도 <span className="text-red-600">*</span>
                </label>
                <select
                  id="year"
                  className={fieldClass("year")}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                >
                  <option value="">선택</option>
                  {YEAR_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {errors.year ? (
                  <p className="mt-1 text-xs text-red-600">{errors.year}</p>
                ) : null}
              </div>

              <div>
                <label className={labelClass} htmlFor="admission_type">
                  전형 종류 <span className="text-red-600">*</span>
                </label>
                <select
                  id="admission_type"
                  className={fieldClass("admission_type")}
                  value={admissionType}
                  onChange={(e) => setAdmissionType(e.target.value)}
                >
                  <option value="">선택</option>
                  {ADMISSION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {errors.admission_type ? (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.admission_type}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="status">
                결과 <span className="text-red-600">*</span>
              </label>
              <select
                id="status"
                className={fieldClass("status")}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">선택</option>
                {RESULT_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.status ? (
                <p className="mt-1 text-xs text-red-600">{errors.status}</p>
              ) : null}
            </div>

            <div>
              <label className={labelClass} htmlFor="review">
                후기 <span className="text-red-600">*</span>
              </label>
              <textarea
                id="review"
                rows={8}
                className={fieldClass("review")}
                placeholder="합격 후기, 준비 과정, 팁 등을 자유롭게 작성해주세요"
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
              <div className="mt-1 text-xs text-gray-500">
                {reviewLen < 50
                  ? `최소 50자 이상 (${reviewLen}/50)`
                  : `${reviewLen}자`}
              </div>
              {errors.review ? (
                <p className="mt-1 text-xs text-red-600">{errors.review}</p>
              ) : null}
            </div>

            <hr className="border-gray-200" />
            <p className="text-sm font-semibold text-sage-800">선택 항목</p>

            <div>
              <label className={labelClass} htmlFor="nickname">
                닉네임
              </label>
              <input
                id="nickname"
                type="text"
                className={inputClass}
                placeholder="익명으로 표시됩니다"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="nationality">
                국적
              </label>
              <input
                id="nationality"
                type="text"
                className={inputClass}
                placeholder="예: Korean, Vietnamese, American"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="topik">
                한국어 수준 TOPIK
              </label>
              <select
                id="topik"
                className={inputClass}
                value={topik}
                onChange={(e) => setTopik(e.target.value)}
              >
                {TOPIK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="pros">
                좋았던 점
              </label>
              <textarea
                id="pros"
                rows={4}
                className={inputClass}
                placeholder="줄바꿈으로 구분해서 입력"
                value={pros}
                onChange={(e) => setPros(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="cons">
                어려웠던 점
              </label>
              <textarea
                id="cons"
                rows={4}
                className={inputClass}
                placeholder="줄바꿈으로 구분해서 입력"
                value={cons}
                onChange={(e) => setCons(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="tips">
                후배에게 주는 팁
              </label>
              <textarea
                id="tips"
                rows={4}
                className={inputClass}
                placeholder="줄바꿈으로 구분해서 입력"
                value={tips}
                onChange={(e) => setTips(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-tea-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-tea-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "등록 중..." : "후기 등록하기"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
