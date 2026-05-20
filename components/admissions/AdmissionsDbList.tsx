"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdmissionRecord } from "@/lib/types";

const PAGE_SIZE = 20;
const YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019];

const selectClass =
  "min-w-[120px] rounded-lg border border-[#ddd] bg-white px-3 py-2 text-sm text-gray-900 " +
  "shadow-sm hover:border-tea-500 focus:border-tea-600 focus:outline-none focus:ring-2 focus:ring-tea-500/30 " +
  "transition-colors";

const toggleBtn =
  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors ";

function commentCount(record: AdmissionRecord): number {
  const c = record.comments;
  if (!Array.isArray(c)) return 0;
  return c.length;
}

function splitUniversities(text: string): string[] {
  return text
    .split(/,\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

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
  return "border-gray-200 bg-gray-100 text-gray-700";
}

function PageNumbers({
  current,
  totalPages,
  onSelect,
}: {
  current: number;
  totalPages: number;
  onSelect: (p: number) => void;
}) {
  const windowSize = 5;
  let start = Math.max(1, current - Math.floor(windowSize / 2));
  let end = Math.min(totalPages, start + windowSize - 1);
  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1);
  }

  const nums: number[] = [];
  for (let i = start; i <= end; i++) nums.push(i);

  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {nums.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onSelect(n)}
          className={`min-w-[2.25rem] rounded-md border px-2 py-1 text-sm transition-colors ${
            n === current
              ? "border-tea-600 bg-tea-50 font-semibold text-tea-900"
              : "border-gray-200 bg-white text-gray-700 hover:border-tea-400"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default function AdmissionsDbList() {
  const [records, setRecords] = useState<AdmissionRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [school, setSchool] = useState("");
  const [year, setYear] = useState("");
  const [admissionType, setAdmissionType] = useState("");
  const [sort, setSort] = useState<"latest" | "popular">("latest");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const offset = (page - 1) * PAGE_SIZE;

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
        sort,
      });
      if (school) params.set("university", school);
      if (year) params.set("year", year);
      if (admissionType) params.set("admission_type", admissionType);

      const res = await fetch(`/api/admissions?${params.toString()}`);
      if (!res.ok) {
        setRecords([]);
        setTotal(0);
        return;
      }
      const json = await res.json();
      setRecords(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      setRecords([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [offset, school, year, admissionType, sort]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const empty = useMemo(
    () => !loading && records.length === 0,
    [loading, records.length]
  );

  return (
    <main className="min-h-screen bg-[#f5f4f0]">
      <div className="border-b border-sage-200/80 bg-white shadow-sm">
        <div className="container mx-auto max-w-5xl px-4 py-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            합격DB
          </h1>
          <p className="mt-2 text-gray-600">
            합격 스펙 및 후기를 공유하고 볼 수 있습니다
          </p>
          <p className="mt-4 text-sm font-medium text-sage-800">
            전체 ({total.toLocaleString()}건)
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-6">
        {/* 필터 바 */}
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-center lg:gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="adm-school">
              학교
            </label>
            <select
              id="adm-school"
              className={selectClass}
              value={school}
              onChange={(e) => {
                setSchool(e.target.value);
                setPage(1);
              }}
            >
              <option value="">전체 학교</option>
              <option value="snu">서울대</option>
              <option value="yonsei">연세대</option>
              <option value="korea">고려대</option>
              <option value="kaist">KAIST</option>
              <option value="skku">성균관대</option>
              <option value="other">기타</option>
            </select>

            <label className="sr-only" htmlFor="adm-year">
              년도
            </label>
            <select
              id="adm-year"
              className={selectClass}
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setPage(1);
              }}
            >
              <option value="">전체 년도</option>
              {YEARS.map((y) => (
                <option key={y} value={String(y)}>
                  {y}년
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="adm-type">
              전형
            </label>
            <select
              id="adm-type"
              className={selectClass}
              value={admissionType}
              onChange={(e) => {
                setAdmissionType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">전체 전형</option>
              <option value="수시">수시</option>
              <option value="정시">정시</option>
              <option value="편입">편입</option>
              <option value="유학">유학</option>
              <option value="어학">어학당</option>
            </select>
          </div>

          <div className="flex gap-2 lg:ml-auto">
            <button
              type="button"
              onClick={() => {
                setSort("latest");
                setPage(1);
              }}
              className={
                toggleBtn +
                (sort === "latest"
                  ? "border-tea-600 bg-tea-50 text-tea-900"
                  : "border-gray-200 bg-white text-gray-600 hover:border-tea-300")
              }
            >
              최신순
            </button>
            <button
              type="button"
              onClick={() => {
                setSort("popular");
                setPage(1);
              }}
              className={
                toggleBtn +
                (sort === "popular"
                  ? "border-tea-600 bg-tea-50 text-tea-900"
                  : "border-gray-200 bg-white text-gray-600 hover:border-tea-300")
              }
            >
              인기순
            </button>
          </div>
        </div>

        {/* 목록 */}
        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-gray-500 shadow-sm">
            불러오는 중...
          </div>
        ) : empty ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sage-100 text-2xl">
              📋
            </div>
            <p className="text-lg font-medium text-gray-800">
              아직 등록된 합격 후기가 없습니다.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              첫 번째 합격 후기를 등록해보세요!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((record) => {
              const nick = record.username?.trim() || "익명";
              const schools = splitUniversities(record.university);
              const likes = record.likes ?? 0;
              const comments = commentCount(record);

              return (
                <div
                  key={record.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
                    {/* 왼쪽 */}
                    <div className="shrink-0 sm:w-36 sm:pt-0.5">
                      <p className="text-sm font-semibold text-gray-900">
                        {record.year}년
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {record.admissionType}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">{nick}</p>
                    </div>

                    {/* 중앙 */}
                    <div className="min-w-0 flex-1 border-sage-100 sm:border-l sm:pl-4">
                      <div className="flex flex-wrap items-baseline gap-2">
                        {schools.map((u) => (
                          <span
                            key={u}
                            className="font-semibold text-gray-900"
                          >
                            {u}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1 text-sm text-gray-700">{record.major}</p>
                      <span
                        className={`mt-2 inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(record.status)}`}
                      >
                        {record.status}
                      </span>
                    </div>

                    {/* 오른쪽 */}
                    <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-gray-100 pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>👍 {likes}</span>
                        <span>💬 {comments}</span>
                      </div>
                      <Link
                        href={`/admissions/${record.id}`}
                        className="text-sm font-medium text-tea-700 hover:text-tea-900 hover:underline"
                      >
                        합격 스펙 및 후기 더보기 →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !empty && totalPages > 1 && (
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:border-tea-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              이전
            </button>
            <PageNumbers
              current={page}
              totalPages={totalPages}
              onSelect={setPage}
            />
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:border-tea-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
