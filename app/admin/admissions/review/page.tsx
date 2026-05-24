"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ADMIT_TRACK_VALUES } from "@/lib/admissions/admit-track";

type QueueItem = {
  id: number;
  title: string;
  user_handle: string;
  year: number;
  admit_track: string | null;
  home_country: string | null;
  high_school_type: string | null;
  input_score: string | null;
  source: string | null;
  source_type: string | null;
  source_url: string | null;
  classifier_confidence: number | null;
  classifier_reasoning: string | null;
  raw_content: string | null;
  created_at: string;
};

function sourceBadge(sourceType: string | null, source: string | null) {
  const label = sourceType?.replace("scraped_", "from ") ?? source ?? "unknown";
  return label;
}

function ReviewInner() {
  const searchParams = useSearchParams();
  const keyFromUrl = searchParams.get("key") ?? "";
  const [key, setKey] = useState(keyFromUrl);
  const [authorized, setAuthorized] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved_today: 0,
    rejected_today: 0,
  });
  const [classifier, setClassifier] = useState({
    dailyCalls: 0,
    dailyLimit: 500,
  });
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState({ title: "", admit_track: "international" });
  const [saving, setSaving] = useState<number | null>(null);

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

  const load = useCallback(async () => {
    if (!key.trim()) {
      setLoadErr("ADMIN_SECRET 또는 ?key= 로 키를 입력하세요.");
      return;
    }
    setLoading(true);
    setLoadErr(null);
    try {
      const res = await fetch("/api/admin/admissions-scraped-review", {
        headers: hdrs(),
      });
      if (res.status === 401) {
        setAuthorized(false);
        setLoadErr("키가 올바르지 않거나 ADMIN_SECRET 미설정입니다.");
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "로드 실패");
      setAuthorized(true);
      setQueue(json.queue ?? []);
      setStats(json.stats ?? { pending: 0, approved_today: 0, rejected_today: 0 });
      setClassifier(json.classifier ?? { dailyCalls: 0, dailyLimit: 500 });
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, [key, hdrs]);

  useEffect(() => {
    if (key.trim()) void load();
  }, [key, load]);

  const patchAction = async (
    id: number,
    action: "approve" | "reject",
    extra?: Record<string, string>
  ) => {
    setSaving(id);
    try {
      const res = await fetch("/api/admin/admissions-scraped-review", {
        method: "PATCH",
        headers: hdrs(true),
        body: JSON.stringify({ id, action, ...extra }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "저장 실패");
      await load();
      setEditingId(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "오류");
    } finally {
      setSaving(null);
    }
  };

  const studyKoreaHref = key.trim()
    ? `/admin/study-korea?key=${encodeURIComponent(key.trim())}`
    : "/admin/study-korea";

  return (
    <div className="min-h-screen bg-slate-100 text-gray-900">
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Link href={studyKoreaHref} className="text-sm text-teal-700 hover:underline">
              ← Study Korea Pipeline
            </Link>
          </div>
          <h1 className="text-xl font-bold">스크래핑 합격 후기 검토</h1>
          <p className="text-sm text-gray-600 mt-1">
            검토 대기 {stats.pending}건 · 오늘 자동 승인 {stats.approved_today}건 · 오늘
            거부 {stats.rejected_today}건
          </p>
          <p className="text-xs text-gray-500 mt-1">
            오늘 LLM 호출 {classifier.dailyCalls}건 / 한도 {classifier.dailyLimit}건
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <input
              type="password"
              placeholder="Admin secret"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="flex-1 min-w-[180px] border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm"
            >
              {loading ? "…" : "새로고침"}
            </button>
          </div>
          {loadErr && <p className="text-red-600 text-sm mt-2">{loadErr}</p>}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {authorized && queue.length === 0 && (
          <p className="text-gray-600 text-sm">검토 대기 항목이 없습니다.</p>
        )}

        {queue.map((item) => (
          <article
            key={item.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                  {sourceBadge(item.source_type, item.source)}
                </span>
                {item.classifier_confidence != null && (
                  <span className="ml-2 text-xs text-gray-500">
                    confidence {Number(item.classifier_confidence).toFixed(2)}
                  </span>
                )}
              </div>
              {item.source_url && (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-teal-700 hover:underline"
                >
                  원문 링크
                </a>
              )}
            </div>

            {editingId === item.id ? (
              <div className="mt-3 space-y-2">
                <input
                  value={editDraft.title}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, title: e.target.value }))
                  }
                  className="w-full border rounded px-2 py-1 text-sm"
                />
                <select
                  value={editDraft.admit_track}
                  onChange={(e) =>
                    setEditDraft((d) => ({ ...d, admit_track: e.target.value }))
                  }
                  className="border rounded px-2 py-1 text-sm"
                >
                  {ADMIT_TRACK_VALUES.filter((t) => t !== "abroad").map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <h2 className="mt-2 font-semibold text-gray-900">{item.title}</h2>
            )}

            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-700">
              <div>
                <dt className="text-gray-500">Year</dt>
                <dd>{item.year}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Track</dt>
                <dd>{item.admit_track ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Country</dt>
                <dd>{item.home_country ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">HS type</dt>
                <dd>{item.high_school_type ?? "—"}</dd>
              </div>
            </dl>

            {item.input_score && (
              <pre className="mt-2 text-xs bg-slate-50 border rounded p-2 whitespace-pre-wrap">
                {item.input_score}
              </pre>
            )}

            {item.classifier_reasoning && (
              <p className="mt-2 text-xs text-amber-900 bg-amber-50 border border-amber-100 rounded p-2">
                {item.classifier_reasoning}
              </p>
            )}

            {item.raw_content && (
              <div className="mt-2">
                <button
                  type="button"
                  className="text-xs text-teal-700 underline"
                  onClick={() =>
                    setExpanded((e) => ({ ...e, [item.id]: !e[item.id] }))
                  }
                >
                  {expanded[item.id] ? "원문 접기" : "원문 펼치기"}
                </button>
                {expanded[item.id] && (
                  <pre className="mt-1 text-xs bg-slate-50 border rounded p-2 max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {item.raw_content}
                  </pre>
                )}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {editingId === item.id ? (
                <>
                  <button
                    type="button"
                    disabled={saving === item.id}
                    onClick={() =>
                      void patchAction(item.id, "approve", {
                        title: editDraft.title,
                        admit_track: editDraft.admit_track,
                      })
                    }
                    className="px-3 py-1.5 rounded bg-green-600 text-white text-sm disabled:opacity-50"
                  >
                    저장 후 승인
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 rounded bg-slate-200 text-sm"
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={saving === item.id}
                    onClick={() => void patchAction(item.id, "approve")}
                    className="px-3 py-1.5 rounded bg-green-600 text-white text-sm disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={saving === item.id}
                    className="px-3 py-1.5 rounded bg-slate-100 text-sm"
                    onClick={() => {
                      setEditDraft({
                        title: item.title,
                        admit_track: item.admit_track ?? "international",
                      });
                      setEditingId(item.id);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={saving === item.id}
                    onClick={() => void patchAction(item.id, "reject")}
                    className="px-3 py-1.5 rounded bg-red-100 text-red-800 text-sm disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}

export default function ScrapedAdmissionsReviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-600">로딩…</div>}>
      <ReviewInner />
    </Suspense>
  );
}
