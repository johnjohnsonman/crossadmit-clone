"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CATEGORY_LABELS_KR } from "@/lib/study-korea/constants";
import { STUDY_KOREA_SOURCE_META } from "@/lib/pipeline/study-korea/sources-registry";

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
  const [statsByCategory, setStatsByCategory] = useState<Record<string, number>>({});
  const [statsBySource, setStatsBySource] = useState<Record<string, number>>({});
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningSource, setRunningSource] = useState<string | null>(null);
  const [runMsg, setRunMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string>("all");

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
      setStatsByCategory(json.stats ?? {});
      setStatsBySource(json.statsBySource ?? {});
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

  const runCron = async (path: string, label: string) => {
    if (!key.trim()) return;
    setRunningSource(label);
    setRunMsg(null);
    try {
      const res = await fetch(path, { headers: { "x-admin-secret": key.trim() } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "실행 실패");
      const saved =
        json.saved ??
        json.totalSaved ??
        json.reddit?.saved ??
        0;
      setRunMsg(`${label} 완료 — 저장 ${saved}건`);
      await loadAll();
    } catch (e) {
      setRunMsg(`${label}: ${e instanceof Error ? e.message : "오류"}`);
    } finally {
      setRunningSource(null);
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
        prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "오류");
    } finally {
      setSaving(null);
    }
  };

  const filteredPosts = useMemo(() => {
    if (sourceFilter === "all") return posts;
    return posts.filter((p) => p.source === sourceFilter);
  }, [posts, sourceFilter]);

  const totalPosts = posts.length;

  return (
    <div className="min-h-screen bg-slate-100 text-gray-900">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">
            Study Korea Pipeline
          </h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Furniblog-style · 6 sources · Claude + Supabase
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <input
              type="password"
              placeholder="Admin secret"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="flex-1 min-w-[180px] border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
            />
            <button
              type="button"
              onClick={() => void loadAll()}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium"
            >
              {loading ? "…" : "새로고침"}
            </button>
            <button
              type="button"
              disabled={!authorized || runningSource !== null}
              onClick={() =>
                void runCron("/api/cron/scrape-study-korea", "전체")
              }
              className="px-4 py-2 rounded-lg bg-tea-600 text-white text-sm font-semibold disabled:opacity-50"
            >
              {runningSource === "전체" ? "실행 중…" : "▶ Run All"}
            </button>
          </div>
          {loadErr && (
            <p className="text-red-600 text-sm mt-2 font-medium">{loadErr}</p>
          )}
          {runMsg && (
            <p className="text-teal-800 text-sm mt-2 font-medium bg-teal-50 px-3 py-2 rounded-lg">
              {runMsg}
            </p>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {authorized && (
          <>
            {/* Run for specific source */}
            <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                Run for specific source
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {STUDY_KOREA_SOURCE_META.map((src) => (
                  <div
                    key={src.id}
                    className="border border-slate-200 rounded-lg p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${src.color}`}
                      >
                        {src.label}
                      </span>
                      <span className="text-xs text-gray-600">
                        {statsBySource[src.id] ?? 0} posts
                      </span>
                    </div>
                    {"requiresEnv" in src && src.requiresEnv && (
                      <p className="text-[10px] text-amber-700">
                        Needs {src.requiresEnv.join(", ")}
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={runningSource !== null}
                      onClick={() => void runCron(src.cronPath, src.label)}
                      className="w-full py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-gray-900 text-sm font-medium disabled:opacity-50"
                    >
                      {runningSource === src.label ? "Running…" : "Run"}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl border p-4">
                <p className="text-xs text-gray-600">Total posts</p>
                <p className="text-2xl font-bold text-gray-900">{totalPosts}</p>
              </div>
              <div className="bg-white rounded-xl border p-4 col-span-1 md:col-span-3">
                <p className="text-xs text-gray-600 mb-2">By category</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(statsByCategory).map(([cat, n]) => (
                    <span
                      key={cat}
                      className="text-xs bg-slate-100 text-gray-900 px-2 py-1 rounded-full"
                    >
                      {CATEGORY_LABELS_KR[cat] ?? cat}: {n}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Pipeline runs */}
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <h2 className="text-sm font-semibold text-gray-900 px-4 py-3 border-b bg-slate-50">
                Recent pipeline runs
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-gray-900">
                  <thead>
                    <tr className="border-b text-left bg-slate-50">
                      <th className="p-2">Time</th>
                      <th className="p-2">Source</th>
                      <th className="p-2">Col</th>
                      <th className="p-2">Saved</th>
                      <th className="p-2">Fail</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100">
                        <td className="p-2 whitespace-nowrap text-gray-900">
                          {new Date(r.created_at).toLocaleString("ko-KR")}
                        </td>
                        <td className="p-2 font-medium">{r.source}</td>
                        <td className="p-2">{r.collected}</td>
                        <td className="p-2 text-green-700 font-medium">
                          {r.saved}
                        </td>
                        <td className="p-2">{r.failed}</td>
                        <td className="p-2">
                          <span
                            className={
                              r.status === "success"
                                ? "text-green-700"
                                : r.status === "failed"
                                  ? "text-red-600"
                                  : "text-amber-700"
                            }
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {runs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-4 text-gray-600 text-center">
                          실행 기록 없음
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Posts */}
            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b bg-slate-50 flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-900">
                  Posts ({filteredPosts.length})
                </h2>
                <div className="flex flex-wrap gap-1 ml-auto">
                  <button
                    type="button"
                    onClick={() => setSourceFilter("all")}
                    className={`text-xs px-2 py-1 rounded-full ${sourceFilter === "all" ? "bg-tea-600 text-white" : "bg-slate-200 text-gray-900"}`}
                  >
                    all
                  </button>
                  {STUDY_KOREA_SOURCE_META.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSourceFilter(s.id)}
                      className={`text-xs px-2 py-1 rounded-full ${sourceFilter === s.id ? "bg-tea-600 text-white" : "bg-slate-200 text-gray-900"}`}
                    >
                      {s.id}
                    </button>
                  ))}
                </div>
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                <table className="w-full text-xs text-gray-900">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b text-left">
                      <th className="p-2">Title</th>
                      <th className="p-2">Cat</th>
                      <th className="p-2">Pub</th>
                      <th className="p-2">★</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50">
                        <td className="p-2 max-w-[280px]">
                          <span className="text-gray-500">[{p.source}] </span>
                          <span className="truncate block">{p.title}</span>
                        </td>
                        <td className="p-2 text-gray-900">
                          {CATEGORY_LABELS_KR[p.category] ?? p.category}
                        </td>
                        <td className="p-2">
                          <button
                            type="button"
                            disabled={saving === p.id + "is_published"}
                            onClick={() =>
                              void patchPost(p.id, "is_published", !p.is_published)
                            }
                            className={`px-2 py-0.5 rounded text-xs font-medium ${p.is_published ? "bg-green-100 text-green-800" : "bg-slate-200 text-gray-900"}`}
                          >
                            {p.is_published ? "ON" : "OFF"}
                          </button>
                        </td>
                        <td className="p-2">
                          <button
                            type="button"
                            disabled={saving === p.id + "is_featured"}
                            onClick={() =>
                              void patchPost(p.id, "is_featured", !p.is_featured)
                            }
                            className={`px-2 py-0.5 rounded text-xs ${p.is_featured ? "text-amber-700" : "text-gray-500"}`}
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
      </main>
    </div>
  );
}

export default function AdminStudyKoreaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 text-gray-900 p-8">
          로딩…
        </div>
      }
    >
      <AdminStudyKoreaInner />
    </Suspense>
  );
}
