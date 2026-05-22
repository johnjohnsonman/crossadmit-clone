"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CATEGORY_LABELS_KR } from "@/lib/study-korea/constants";

type PipelineRun = {
  id: string;
  source: string;
  query: string;
  collected: number;
  processed: number;
  saved: number;
  failed: number;
  status: string;
  error_message: string;
  created_at: string;
};

type AdminPost = {
  id: string;
  source: string;
  title: string;
  category: string;
  university: string;
  is_published: boolean;
  is_featured: boolean;
  upvotes: number;
  created_at: string;
};

function AdminStudyKoreaInner() {
  const searchParams = useSearchParams();
  const keyFromUrl = searchParams.get("key") ?? "";
  const [key, setKey] = useState(keyFromUrl);
  const [authorized, setAuthorized] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (keyFromUrl && keyFromUrl !== key) setKey(keyFromUrl);
  }, [keyFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const hdrs = useCallback(
    (json = false): HeadersInit => ({
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(key.trim() ? { "x-admin-secret": key.trim() } : {}),
    }),
    [key]
  );

  const loadAll = useCallback(async () => {
    if (!key.trim()) {
      setLoadErr("ADMIN_SECRET 또는 ?key= 로 키를 입력하세요.");
      return;
    }
    setLoading(true);
    setLoadErr(null);
    try {
      const res = await fetch("/api/admin/study-korea", { headers: hdrs() });
      if (res.status === 401) {
        setAuthorized(false);
        setLoadErr("키가 올바르지 않거나 ADMIN_SECRET 미설정입니다.");
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "로드 실패");
      setAuthorized(true);
      setRuns(json.runs ?? []);
      setStats(json.stats ?? {});
      setPosts(json.posts ?? []);
    } catch (e) {
      setAuthorized(false);
      setLoadErr(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, [hdrs, key]);

  useEffect(() => {
    if (keyFromUrl.trim()) void loadAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const runPipeline = async () => {
    if (!key.trim()) return;
    setRunning(true);
    setRunMsg(null);
    try {
      const res = await fetch("/api/cron/scrape-study-korea", {
        headers: { "x-admin-secret": key.trim() },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "실행 실패");
      setRunMsg(
        `완료 — Reddit 저장 ${json.reddit?.saved ?? 0}, YouTube 저장 ${json.youtube?.saved ?? 0}`
      );
      await loadAll();
    } catch (e) {
      setRunMsg(e instanceof Error ? e.message : "실행 오류");
    } finally {
      setRunning(false);
    }
  };

  const patchPost = async (
    id: string,
    field: "is_published" | "is_featured",
    value: boolean
  ) => {
    setSaving(id + field);
    try {
      const res = await fetch("/api/admin/study-korea", {
        method: "PATCH",
        headers: hdrs(true),
        body: JSON.stringify({ id, [field]: value }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "저장 실패");
      setPosts((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, [field]: value } : p
        )
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "오류");
    } finally {
      setSaving(null);
    }
  };

  const statEntries = useMemo(
    () => Object.entries(stats).sort((a, b) => b[1] - a[1]),
    [stats]
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Study Korea 파이프라인
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        ADMIN_SECRET · Reddit + YouTube 수집 · Claude 요약
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        <input
          type="password"
          placeholder="Admin secret"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-[200px] bg-white text-gray-900 placeholder:text-gray-500"
        />
        <button
          type="button"
          onClick={() => void loadAll()}
          disabled={loading}
          className="px-4 py-2 bg-gray-800 text-white rounded text-sm font-medium"
        >
          {loading ? "로딩…" : "불러오기"}
        </button>
        <button
          type="button"
          onClick={() => void runPipeline()}
          disabled={running || !authorized}
          className="px-4 py-2 bg-tea-600 text-white rounded text-sm font-medium disabled:opacity-50"
        >
          {running ? "수집 중…" : "수동 실행"}
        </button>
      </div>

      {loadErr && (
        <p className="text-red-600 text-sm mb-4 font-medium">{loadErr}</p>
      )}
      {runMsg && (
        <p className="text-gray-900 text-sm mb-4 font-medium">{runMsg}</p>
      )}

      {authorized && (
        <>
          <section className="mb-8 bg-white rounded-lg border border-gray-200 p-4 text-gray-900">
            <h2 className="font-semibold text-gray-900 mb-3">
              최근 파이프라인 실행 (10건)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm text-gray-900">
                <thead>
                  <tr className="text-left border-b border-gray-200 text-gray-900">
                    <th className="py-2 pr-2 text-gray-900">시각</th>
                    <th className="py-2 pr-2 text-gray-900">소스</th>
                    <th className="py-2 pr-2 text-gray-900">수집</th>
                    <th className="py-2 pr-2 text-gray-900">저장</th>
                    <th className="py-2 pr-2 text-gray-900">실패</th>
                    <th className="py-2 text-gray-900">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-gray-100 text-gray-900"
                    >
                      <td className="py-2 pr-2 whitespace-nowrap text-gray-900">
                        {new Date(r.created_at).toLocaleString("ko-KR")}
                      </td>
                      <td className="py-2 pr-2 text-gray-900">{r.source}</td>
                      <td className="py-2 pr-2 text-gray-900">{r.collected}</td>
                      <td className="py-2 pr-2 text-gray-900">{r.saved}</td>
                      <td className="py-2 pr-2 text-gray-900">{r.failed}</td>
                      <td className="py-2 text-gray-900">
                        <span
                          className={
                            r.status === "success"
                              ? "text-green-700 font-medium"
                              : r.status === "failed"
                                ? "text-red-600 font-medium"
                                : "text-amber-700 font-medium"
                          }
                        >
                          {r.status}
                        </span>
                        {r.error_message && (
                          <span className="block text-gray-600 truncate max-w-[200px]">
                            {r.error_message}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {runs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-gray-600">
                        실행 기록 없음
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8 bg-white rounded-lg border border-gray-200 p-4 text-gray-900">
            <h2 className="font-semibold text-gray-900 mb-3">카테고리별 통계</h2>
            <div className="flex flex-wrap gap-2">
              {statEntries.map(([cat, n]) => (
                <span
                  key={cat}
                  className="px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-900"
                >
                  {CATEGORY_LABELS_KR[cat] ?? cat}: {n}
                </span>
              ))}
              {statEntries.length === 0 && (
                <span className="text-gray-600 text-sm">데이터 없음</span>
              )}
            </div>
          </section>

          <section className="bg-white rounded-lg border border-gray-200 p-4 text-gray-900">
            <h2 className="font-semibold text-gray-900 mb-3">
              게시물 ({posts.length})
            </h2>
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <table className="w-full text-xs text-gray-900">
                <thead className="sticky top-0 bg-white">
                  <tr className="text-left border-b border-gray-200 text-gray-900">
                    <th className="py-2 pr-2 text-gray-900">제목</th>
                    <th className="py-2 pr-2 text-gray-900">카테고리</th>
                    <th className="py-2 pr-2 text-gray-900">공개</th>
                    <th className="py-2 text-gray-900">추천</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-gray-50 text-gray-900"
                    >
                      <td className="py-2 pr-2 max-w-[240px] truncate text-gray-900">
                        <span className="text-gray-600 mr-1">[{p.source}]</span>
                        {p.title}
                      </td>
                      <td className="py-2 pr-2 text-gray-900">
                        {CATEGORY_LABELS_KR[p.category] ?? p.category}
                      </td>
                      <td className="py-2 pr-2">
                        <button
                          type="button"
                          disabled={saving === p.id + "is_published"}
                          onClick={() =>
                            void patchPost(p.id, "is_published", !p.is_published)
                          }
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            p.is_published
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-200 text-gray-900"
                          }`}
                        >
                          {p.is_published ? "ON" : "OFF"}
                        </button>
                      </td>
                      <td className="py-2">
                        <button
                          type="button"
                          disabled={saving === p.id + "is_featured"}
                          onClick={() =>
                            void patchPost(p.id, "is_featured", !p.is_featured)
                          }
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            p.is_featured
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-200 text-gray-900"
                          }`}
                        >
                          {p.is_featured ? "★" : "—"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function AdminStudyKoreaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 bg-gray-50 text-gray-900">로딩…</div>
      }
    >
      <AdminStudyKoreaInner />
    </Suspense>
  );
}
