"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import AutocompleteInput from "@/components/AutocompleteInput";
import { KOREAN_MAJORS } from "@/lib/data/korean-majors";
import {
  KOREAN_UNIVERSITIES,
  resolveUniversityInput,
} from "@/lib/data/korean-universities";

type SchoolStatus = "합격" | "등록" | "불합격";

type SchoolRow = {
  id: string;
  universityInput: string;
  majorInput: string;
  status: SchoolStatus;
  univId: number;
  deptId: number;
};

function newRow(): SchoolRow {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    universityInput: "",
    majorInput: "",
    status: "합격",
    univId: 0,
    deptId: 0,
  };
}

const MAX_SCHOOLS = 10;
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
  "기타",
];

const TOPIK_OPTIONS = [
  { value: "none", label: "없음" },
  { value: "1", label: "1급" },
  { value: "2", label: "2급" },
  { value: "3", label: "3급" },
  { value: "4", label: "4급" },
  { value: "5", label: "5급" },
  { value: "6", label: "6급" },
];

const uniLabels = KOREAN_UNIVERSITIES.map((u) => u.nameKo);
const uniHints = KOREAN_UNIVERSITIES.map((u) => u.nameEn);

const inputBase =
  "block w-full rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-sm text-white shadow-sm " +
  "placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500";
const inputClass = `mt-1 ${inputBase}`;
const labelClass = "block text-sm font-medium text-gray-300";

function statusSelectClass(s: SchoolStatus): string {
  switch (s) {
    case "등록":
      return `${inputBase} mt-1 border-2 border-emerald-500 bg-emerald-50 font-bold text-emerald-900`;
    case "합격":
      return `${inputBase} mt-1 border-blue-500 bg-blue-50 text-blue-900`;
    case "불합격":
      return `${inputBase} mt-1 border-red-500 bg-red-50 text-red-900`;
    default:
      return `${inputBase} mt-1`;
  }
}

export default function AdmissionNewPage() {
  const router = useRouter();
  const [rows, setRows] = useState<SchoolRow[]>([
    newRow(),
    newRow(),
  ]);
  const [year, setYear] = useState("");
  const [admissionType, setAdmissionType] = useState("");
  const [specOpen, setSpecOpen] = useState(false);

  const [nickname, setNickname] = useState("");
  const [nationality, setNationality] = useState("");
  const [csatTotal, setCsatTotal] = useState("");
  const [csatKorean, setCsatKorean] = useState("");
  const [csatMath, setCsatMath] = useState("");
  const [csatEnglish, setCsatEnglish] = useState("");
  const [csatInquiry, setCsatInquiry] = useState("");
  const [gpaGrade, setGpaGrade] = useState("");
  const [topik, setTopik] = useState("none");
  const [satAct, setSatAct] = useState("");
  const [englishTest, setEnglishTest] = useState("");
  const [review, setReview] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [deptOptions, setDeptOptions] = useState<Record<string, string[]>>({});

  const schoolsPayload = useMemo(() => {
    const list: {
      univ_id: number;
      dept_id: number;
      univ_name: string;
      dept_name: string;
      status: SchoolStatus;
    }[] = [];
    for (const r of rows) {
      const { nameKo } = resolveUniversityInput(r.universityInput);
      const univName = r.universityInput.trim() || nameKo;
      const deptName = r.majorInput.trim();
      if (!univName && !deptName) continue;
      if (!univName || !deptName) return { ok: false as const, list };
      list.push({
        univ_id: r.univId,
        dept_id: r.deptId,
        univ_name: univName,
        dept_name: deptName,
        status: r.status,
      });
    }
    return { ok: true as const, list };
  }, [rows]);

  async function loadUniversities(q: string): Promise<string[]> {
    if (!q.trim()) return uniLabels;
    try {
      const res = await fetch(
        `/api/universities?search=${encodeURIComponent(q.trim())}`
      );
      const data = await res.json();
      const names = (data.universities ?? []).map(
        (u: { name_kr: string }) => u.name_kr
      );
      return names.length > 0 ? names : uniLabels;
    } catch {
      return uniLabels;
    }
  }

  async function onUniversityPick(rowId: string, name: string) {
    updateRow(rowId, { universityInput: name, univId: 0, deptId: 0 });
    try {
      const res = await fetch(
        `/api/universities?search=${encodeURIComponent(name.trim())}`
      );
      const data = await res.json();
      const match = (data.universities ?? []).find(
        (u: { name_kr: string; id: number }) => u.name_kr === name
      );
      if (match) {
        updateRow(rowId, { univId: match.id });
        const dRes = await fetch(`/api/universities?univ_id=${match.id}`);
        const dData = await dRes.json();
        const opts = (dData.departments ?? []).map(
          (d: { dept_name: string }) => d.dept_name
        );
        setDeptOptions((prev) => ({ ...prev, [rowId]: opts }));
      }
    } catch {
      /* fallback static lists */
    }
  }

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => router.push("/admissions"), 3000);
    return () => clearTimeout(t);
  }, [success, router]);

  function updateRow(id: string, patch: Partial<SchoolRow>) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  }

  function addRow() {
    setRows((prev) =>
      prev.length >= MAX_SCHOOLS ? prev : [...prev, newRow()]
    );
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    if (!schoolsPayload.ok) {
      setFormError("각 학교 행에서 학교명과 학과를 모두 입력해주세요.");
      return;
    }
    if (schoolsPayload.list.length === 0) {
      setFormError("지원 학교를 1개 이상 입력해주세요.");
      return;
    }
    if (!year) {
      setFormError("입학 연도를 선택해주세요.");
      return;
    }
    if (!admissionType) {
      setFormError("전형 종류를 선택해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admissions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schools: schoolsPayload.list,
          year: parseInt(year, 10),
          admission_type: admissionType,
          nickname: nickname.trim(),
          input_score: csatTotal.trim(),
          input_gpa: gpaGrade.trim(),
          input_specialty: [satAct.trim(), englishTest.trim()]
            .filter(Boolean)
            .join(" / "),
          review: review.trim(),
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
      <main className="min-h-screen bg-gray-950 py-12">
        <div className="container mx-auto max-w-lg px-4 text-center">
          <div className="rounded-xl border border-orange-200 bg-gray-900 p-8 shadow-sm">
            <p className="text-lg font-semibold text-white">
              후기가 등록되었습니다! 검토 후 게시됩니다. 감사합니다 🎉
            </p>
            <Link
              href="/admissions"
              className="mt-6 inline-flex rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
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
    <main className="min-h-screen bg-gray-950 pb-20 pt-10">
      <div className="container mx-auto max-w-3xl px-4">
        <Link
          href="/admissions"
          className="text-sm font-medium text-orange-700 hover:text-orange-900 hover:underline"
        >
          ← 합격DB 목록
        </Link>

        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900 p-6 shadow-sm md:p-8">
          <h1 className="text-2xl font-bold text-white">합격 후기 등록</h1>
          <p className="mt-2 text-sm text-gray-600">
            로그인 없이 등록 가능합니다. 허위 정보는 삭제될 수 있습니다.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-10">
            {formError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {formError}
              </div>
            ) : null}

            {/* 지원 학교 */}
            <section>
              <h2 className="text-lg font-semibold text-white">
                지원 학교 및 결과
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                합격/불합격한 학교를 모두 입력하고, 등록한 학교에
                &apos;등록&apos;을 선택하세요
              </p>

              <div className="mt-4 space-y-2">
                {rows.map((row, idx) => (
                  <div
                    key={row.id}
                    className="rounded-lg border border-gray-800 bg-gray-900 p-3 shadow-sm"
                  >
                    <div className="flex flex-wrap items-end gap-2 md:flex-nowrap md:gap-3">
                      <div className="min-w-0 flex-1">
                        <label className={labelClass} htmlFor={`u-${row.id}`}>
                          학교명
                        </label>
                        <AutocompleteInput
                          id={`u-${row.id}`}
                          options={uniLabels}
                          searchHints={uniHints}
                          value={row.universityInput}
                          onChange={(v) =>
                            updateRow(row.id, {
                              universityInput: v,
                              univId: 0,
                              deptId: 0,
                            })
                          }
                          onSelect={(v) => void onUniversityPick(row.id, v)}
                          loadOptions={loadUniversities}
                          placeholder="검색 또는 직접 입력"
                          className={inputClass}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <label className={labelClass} htmlFor={`m-${row.id}`}>
                          학과
                        </label>
                        <AutocompleteInput
                          id={`m-${row.id}`}
                          options={
                            deptOptions[row.id]?.length
                              ? deptOptions[row.id]
                              : KOREAN_MAJORS
                          }
                          value={row.majorInput}
                          onChange={(v) =>
                            updateRow(row.id, { majorInput: v, deptId: 0 })
                          }
                          placeholder="검색 또는 직접 입력"
                          className={inputClass}
                        />
                      </div>
                      <div className="w-full shrink-0 md:w-36">
                        <label className={labelClass} htmlFor={`s-${row.id}`}>
                          결과
                        </label>
                        <select
                          id={`s-${row.id}`}
                          className={statusSelectClass(row.status)}
                          value={row.status}
                          onChange={(e) =>
                            updateRow(row.id, {
                              status: e.target.value as SchoolStatus,
                            })
                          }
                        >
                          <option value="합격">합격</option>
                          <option value="등록">등록</option>
                          <option value="불합격">불합격</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length <= 1}
                        className="mb-0.5 rounded-md border border-gray-800 px-2 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title="행 삭제"
                      >
                        ×
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">행 {idx + 1}</p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addRow}
                disabled={rows.length >= MAX_SCHOOLS}
                className="mt-2 w-full rounded-lg border-2 border-dashed border-gray-400 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-orange-400 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + 학교 추가
                {rows.length >= MAX_SCHOOLS
                  ? ` (최대 ${MAX_SCHOOLS}개)`
                  : ""}
              </button>
            </section>

            {/* 필수: 입학 연도 · 전형 (항상 표시) */}
            <section>
              <h2 className="text-lg font-semibold text-white">
                입학 정보 <span className="text-sm font-normal text-red-600">(필수)</span>
              </h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="year">
                    입학 연도
                  </label>
                  <select
                    id="year"
                    className={inputClass}
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
                </div>
                <div>
                  <label className={labelClass} htmlFor="admission_type">
                    전형 종류
                  </label>
                  <select
                    id="admission_type"
                    className={inputClass}
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
                </div>
              </div>
            </section>

            {/* 선택 스펙 접기 */}
            <section className="border-t border-gray-100 pt-6">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left"
                onClick={() => setSpecOpen((o) => !o)}
              >
                <span className="text-lg font-semibold text-white">
                  공통 스펙 정보 (선택사항)
                </span>
                <span className="text-orange-600">
                  {specOpen ? "접기" : "펼치기"}
                </span>
              </button>

              {specOpen ? (
                <div className="mt-4 space-y-6">

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="nickname">
                        닉네임
                      </label>
                      <input
                        id="nickname"
                        type="text"
                        className={inputClass}
                        placeholder="익명"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
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
                        placeholder="예: Korean, Vietnamese"
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="csat_total">
                      수능 총점 또는 백분위
                    </label>
                    <input
                      id="csat_total"
                      type="text"
                      className={inputClass}
                      value={csatTotal}
                      onChange={(e) => setCsatTotal(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="csat_korean">
                        수능 국어
                      </label>
                      <input
                        id="csat_korean"
                        type="text"
                        className={inputClass}
                        value={csatKorean}
                        onChange={(e) => setCsatKorean(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="csat_math">
                        수능 수학
                      </label>
                      <input
                        id="csat_math"
                        type="text"
                        className={inputClass}
                        value={csatMath}
                        onChange={(e) => setCsatMath(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="csat_english">
                        수능 영어
                      </label>
                      <input
                        id="csat_english"
                        type="text"
                        className={inputClass}
                        value={csatEnglish}
                        onChange={(e) => setCsatEnglish(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="csat_inquiry">
                        수능 탐구
                      </label>
                      <input
                        id="csat_inquiry"
                        type="text"
                        className={inputClass}
                        value={csatInquiry}
                        onChange={(e) => setCsatInquiry(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="gpa_grade">
                        학생부 교과 등급 (GPA)
                      </label>
                      <input
                        id="gpa_grade"
                        type="text"
                        className={inputClass}
                        value={gpaGrade}
                        onChange={(e) => setGpaGrade(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="topik">
                        TOPIK 등급 (외국인)
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
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass} htmlFor="sat_act">
                        SAT / ACT 점수 (해외)
                      </label>
                      <input
                        id="sat_act"
                        type="text"
                        className={inputClass}
                        value={satAct}
                        onChange={(e) => setSatAct(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="english_test">
                        영어 점수 (TOEFL / IELTS 등)
                      </label>
                      <input
                        id="english_test"
                        type="text"
                        className={inputClass}
                        value={englishTest}
                        onChange={(e) => setEnglishTest(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="review">
                      자유 후기
                    </label>
                    <textarea
                      id="review"
                      rows={6}
                      className={inputClass}
                      placeholder="준비 과정, 팁, 생각 등을 자유롭게 작성해주세요."
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  닉네임·성적·자유 후기 등 선택 항목을 펼쳐 입력할 수 있습니다.
                </p>
              )}
            </section>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-orange-600 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "등록 중..." : "합격 후기 등록하기"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
