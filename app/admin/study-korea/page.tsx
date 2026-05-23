"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { CATEGORY_LABELS_KR } from "@/lib/study-korea/constants";
import {
  STUDY_KOREA_SOURCE_META,
  getSourceCardBorder,
  type SourceStatus,
} from "@/lib/pipeline/study-korea/sources-registry";

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
  ai_summary?: string;
  ai_summary_kr?: string;
  ai_title_en?: string;
  ai_summary_en?: string;
};

type AdminUniv = {
  id: number;
  name_kr: string;
  name_en: string;
  intl_url: string;
  intl_url_verified: boolean;
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
  const [universities, setUniversities] = useState<AdminUniv[]>([]);
  const [univEdits, setUnivEdits] = useState<
    Record<number, { intl_url: string; intl_url_verified: boolean }>
  >({});
  const [loading, setLoading] = useState(false);
  const [runningSource, setRunningSource] = useState<string | null>(null);
  const [runMsg, setRunMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [enRows, setEnRows] = useState<Set<string>>(new Set());
  const [enBackfill, setEnBackfill] = useState({
    total: 0,
    translated: 0,
    remaining: 0,
  });
  const [enBackfillLoading, setEnBackfillLoading] = useState(false);
  const [enBackfillRunning, setEnBackfillRunning] = useState(false);
  const [enBackfillAuto, setEnBackfillAuto] = useState(false);
  const [enBackfillLog, setEnBackfillLog] = useState<string | null>(null);
  const enBackfillStopRef = useRef(false);

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

  const loadBackfillStatus = useCallback(async () => {
    if (!key.trim()) return;
    setEnBackfillLoading(true);
    try {
      const res = await fetch("/api/admin/backfill-english", {
        headers: hdrs(),
      });
      if (res.status === 401) return;
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "상태 조회 실패");
      setEnBackfill({
        total: json.total ?? 0,
        translated: json.translated ?? 0,
        remaining: json.remaining ?? 0,
      });
    } catch (e) {
      setEnBackfillLog(
        e instanceof Error ? e.message : "영어 백필 상태 조회 오류"
      );
    } finally {
      setEnBackfillLoading(false);
    }
  }, [key, hdrs]);

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
      const univs = (json.universities ?? []) as AdminUniv[];
      setUniversities(univs);
      const edits: Record<
        number,
        { intl_url: string; intl_url_verified: boolean }
      > = {};
      for (const u of univs) {
        edits[u.id] = {
          intl_url: u.intl_url ?? "",
          intl_url_verified: Boolean(u.intl_url_verified),
        };
      }
      setUnivEdits(edits);
      void loadBackfillStatus();
    } catch (e) {
      setAuthorized(false);
      setLoadErr(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, [hdrs, key, loadBackfillStatus]);

  useEffect(() => {
    if (keyFromUrl.trim()) void loadAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const statusBadge = (status: SourceStatus, label?: string) => {
    if (status === "active") return null;
    const text =
      label ??
      (status === "config_required" ? "설정 필요" : "지원 불가");
    const cls =
      status === "config_required"
        ? "bg-amber-100 text-amber-900"
        : "bg-slate-200 text-slate-600";
    return (
      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${cls}`}>
        {text}
      </span>
    );
  };

  const runBackfillBatch = async () => {
    if (!key.trim() || enBackfillRunning) return;
    setEnBackfillRunning(true);
    setEnBackfillLog(null);
    try {
      const res = await fetch("/api/admin/backfill-english", {
        method: "POST",
        headers: hdrs(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "번역 실패");
      setEnBackfill({
        total: json.total ?? 0,
        translated: json.translated ?? 0,
        remaining: json.remaining ?? 0,
      });
      const batch = json.batch;
      if (batch?.updated) {
        setEnBackfillLog(
          `10건 처리 — 성공 ${batch.updated}건, 실패 ${batch.failed ?? 0}건`
        );
      } else if (batch?.processed === 0) {
        setEnBackfillLog("번역할 게시물이 없습니다.");
      } else {
        setEnBackfillLog("배치 완료");
      }
      await loadAll();
    } catch (e) {
      setEnBackfillLog(e instanceof Error ? e.message : "번역 오류");
    } finally {
      setEnBackfillRunning(false);
    }
  };

  const stopBackfillAuto = () => {
    enBackfillStopRef.current = true;
    setEnBackfillAuto(false);
    setEnBackfillLog("자동 실행 중지됨");
  };

  const runBackfillAuto = async () => {
    if (!key.trim() || enBackfillAuto) return;
    enBackfillStopRef.current = false;
    setEnBackfillAuto(true);
    setEnBackfillLog("전체 자동 실행 시작…");
    try {
      while (!enBackfillStopRef.current) {
        const statusRes = await fetch("/api/admin/backfill-english", {
          headers: hdrs(),
        });
        const statusJson = await statusRes.json();
        if (!statusRes.ok) {
          throw new Error(statusJson.error || "상태 조회 실패");
        }
        setEnBackfill({
          total: statusJson.total ?? 0,
          translated: statusJson.translated ?? 0,
          remaining: statusJson.remaining ?? 0,
        });
        if ((statusJson.remaining ?? 0) === 0) {
          setEnBackfillLog("전체 번역 완료");
          break;
        }

        const postRes = await fetch("/api/admin/backfill-english", {
          method: "POST",
          headers: hdrs(),
        });
        const postJson = await postRes.json();
        if (!postRes.ok) {
          throw new Error(postJson.error || "번역 실패");
        }
        setEnBackfill({
          total: postJson.total ?? 0,
          translated: postJson.translated ?? 0,
          remaining: postJson.remaining ?? 0,
        });
        const u = postJson.batch?.updated ?? 0;
        const f = postJson.batch?.failed ?? 0;
        setEnBackfillLog(
          `진행 중… ${postJson.translated}/${postJson.total} (이번 배치 +${u}, 실패 ${f})`
        );

        if ((postJson.batch?.processed ?? 0) === 0) {
          setEnBackfillLog("더 이상 처리할 항목이 없습니다.");
          break;
        }

        if (enBackfillStopRef.current) break;
        await new Promise((r) => setTimeout(r, 2000));
      }
      await loadAll();
    } catch (e) {
      setEnBackfillLog(e instanceof Error ? e.message : "자동 실행 오류");
    } finally {
      setEnBackfillAuto(false);
      enBackfillStopRef.current = false;
    }
  };

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

  const saveUniversityIntl = async (univ: AdminUniv) => {
    const edit = univEdits[univ.id];
    if (!edit) return;
    setSaving(`univ-${univ.id}`);
    try {
      const res = await fetch("/api/admin/study-korea", {
        method: "PATCH",
        headers: hdrs(true),
        body: JSON.stringify({
          universityId: univ.id,
          intl_url: edit.intl_url,
          intl_url_verified: edit.intl_url_verified,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "저장 실패");
      const updated = json.university as AdminUniv;
      setUniversities((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u))
      );
      setUnivEdits((prev) => ({
        ...prev,
        [updated.id]: {
          intl_url: updated.intl_url ?? "",
          intl_url_verified: Boolean(updated.intl_url_verified),
        },
      }));
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

  const togglePostEn = (id: string) => {
    setEnRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const postTitleDisplay = (p: AdminPost) => {
    if (enRows.has(p.id)) {
      return p.ai_title_en?.trim() || p.title;
    }
    return p.title;
  };

  const postSummaryDisplay = (p: AdminPost) => {
    if (enRows.has(p.id)) {
      return p.ai_summary_en?.trim() || p.ai_summary || "";
    }
    return p.ai_summary_kr?.trim() || p.ai_summary || "";
  };

  const totalPosts = posts.length;
  const backfillPct =
    enBackfill.total > 0
      ? Math.round((enBackfill.translated / enBackfill.total) * 100)
      : 0;

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
            {/* English backfill */}
            <section className="bg-blue-50 rounded-xl border border-blue-200 p-4 shadow-sm">
              <h2 className="text-sm font-bold text-blue-900 mb-2">
                🌐 영어 번역 백필
              </h2>
              <p className="text-sm text-blue-800 mb-3">
                <span className="font-semibold tabular-nums">
                  {enBackfill.translated}
                </span>
                {" / "}
                <span className="font-semibold tabular-nums">
                  {enBackfill.total}
                </span>
                {enBackfillLoading ? (
                  <span className="text-blue-600 ml-2">(불러오는 중…)</span>
                ) : (
                  <span className="text-blue-700 ml-2">
                    (남은 {enBackfill.remaining}건)
                  </span>
                )}
              </p>
              <div className="h-3 w-full rounded-full bg-blue-100 overflow-hidden mb-3">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${backfillPct}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={
                    enBackfillRunning ||
                    enBackfillAuto ||
                    enBackfill.remaining === 0
                  }
                  onClick={() => void runBackfillBatch()}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {enBackfillRunning ? "번역 중…" : "▶ 10건 번역"}
                </button>
                <button
                  type="button"
                  disabled={
                    enBackfillRunning ||
                    enBackfillAuto ||
                    enBackfill.remaining === 0
                  }
                  onClick={() => void runBackfillAuto()}
                  className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-50"
                >
                  {enBackfillAuto ? "자동 실행 중…" : "▶▶ 전체 자동 실행"}
                </button>
                <button
                  type="button"
                  disabled={!enBackfillAuto}
                  onClick={stopBackfillAuto}
                  className="px-4 py-2 rounded-lg bg-white border border-blue-300 text-blue-900 text-sm font-medium hover:bg-blue-100 disabled:opacity-50"
                >
                  ⏹ 중지
                </button>
              </div>
              {enBackfillLog && (
                <p className="text-xs text-blue-800 mt-3 bg-blue-100/80 px-3 py-2 rounded-lg">
                  {enBackfillLog}
                </p>
              )}
            </section>

            {/* Run for specific source */}
            <section className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                Run for specific source
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {STUDY_KOREA_SOURCE_META.map((src) => {
                  const showRun = src.status === "active" && src.cronPath;

                  return (
                    <div
                      key={src.id}
                      className={`rounded-lg p-3 flex flex-col gap-2 ${getSourceCardBorder(src.status)}`}
                    >
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${src.color}`}
                        >
                          {src.label}
                        </span>
                        {statusBadge(src.status, src.statusLabel)}
                      </div>
                      <span className="text-xs text-gray-600">
                        {statsBySource[src.id] ?? 0} posts
                      </span>
                      {src.note && (
                        <p className="text-[10px] text-gray-500">{src.note}</p>
                      )}
                      {src.requiresEnv && src.status === "active" && (
                        <p className="text-[10px] text-amber-700">
                          Env: {src.requiresEnv.join(", ")}
                        </p>
                      )}
                      {src.statusLabel && src.status !== "active" && (
                        <p className="text-[10px] text-gray-600 leading-snug">
                          {src.statusLabel}
                        </p>
                      )}
                      {showRun ? (
                        <button
                          type="button"
                          disabled={runningSource !== null}
                          onClick={() =>
                            void runCron(src.cronPath!, src.label)
                          }
                          className="w-full py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-gray-900 text-sm font-medium disabled:opacity-50"
                        >
                          {runningSource === src.label ? "Running…" : "Run"}
                        </button>
                      ) : null}
                    </div>
                  );
                })}
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
                      <th className="p-2 w-12">EN</th>
                      <th className="p-2">Title</th>
                      <th className="p-2">Cat</th>
                      <th className="p-2">Pub</th>
                      <th className="p-2">★</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50">
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => togglePostEn(p.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              enRows.has(p.id)
                                ? "bg-tea-600 text-white"
                                : "bg-slate-200 text-gray-700"
                            }`}
                          >
                            EN
                          </button>
                        </td>
                        <td className="p-2 max-w-[280px]">
                          <span className="text-gray-500">[{p.source}] </span>
                          <span className="truncate block font-medium">
                            {postTitleDisplay(p)}
                          </span>
                          {postSummaryDisplay(p) && (
                            <span className="text-gray-500 line-clamp-2 block mt-0.5">
                              {postSummaryDisplay(p)}
                            </span>
                          )}
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

            <section className="bg-white rounded-xl border border-slate-200 overflow-hidden mt-6">
              <div className="px-4 py-3 border-b bg-slate-50">
                <h2 className="text-sm font-semibold text-gray-900">
                  대학 국제처 URL ({universities.length})
                </h2>
                <p className="text-xs text-gray-600 mt-1">
                  intl_url_verified=true 인 대학만 University Intl 크론이
                  스크래핑합니다.
                </p>
              </div>
              <div className="max-h-[480px] overflow-y-auto p-4 space-y-3">
                {universities.map((u) => {
                  const edit = univEdits[u.id] ?? {
                    intl_url: "",
                    intl_url_verified: false,
                  };
                  return (
                    <div
                      key={u.id}
                      className="border border-slate-200 rounded-lg p-3 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          {u.name_kr}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {u.name_en}
                        </span>
                        <label className="ml-auto flex items-center gap-1.5 text-xs text-gray-800">
                          <input
                            type="checkbox"
                            checked={edit.intl_url_verified}
                            onChange={(e) =>
                              setUnivEdits((prev) => ({
                                ...prev,
                                [u.id]: {
                                  ...edit,
                                  intl_url_verified: e.target.checked,
                                },
                              }))
                            }
                          />
                          verified (스크래핑)
                        </label>
                      </div>
                      <input
                        type="url"
                        value={edit.intl_url}
                        onChange={(e) =>
                          setUnivEdits((prev) => ({
                            ...prev,
                            [u.id]: { ...edit, intl_url: e.target.value },
                          }))
                        }
                        placeholder="https://..."
                        className="w-full border border-slate-300 rounded px-2 py-1.5 text-xs text-gray-900 bg-white"
                      />
                      <button
                        type="button"
                        disabled={saving === `univ-${u.id}`}
                        onClick={() => void saveUniversityIntl(u)}
                        className="mt-2 px-3 py-1 rounded bg-tea-600 text-white text-xs font-medium disabled:opacity-50"
                      >
                        {saving === `univ-${u.id}` ? "저장 중…" : "저장"}
                      </button>
                    </div>
                  );
                })}
                {universities.length === 0 && (
                  <p className="text-gray-600 text-sm text-center py-6">
                    name_en 이 있는 대학이 없습니다.
                  </p>
                )}
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
