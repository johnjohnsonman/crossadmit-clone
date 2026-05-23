"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ExtractedAdmission } from "@/lib/pipeline/study-korea/extract-admission-review";

type PendingPost = {
  id: string;
  title: string;
  content: string | null;
  url: string | null;
  slug: string | null;
  source: string;
  created_at: string;
};

type ApiJson = Record<string, unknown>;

async function parseApiJson(res: Response): Promise<ApiJson> {
  try {
    return (await res.json()) as ApiJson;
  } catch {
    return { error: "응답 파싱 실패" };
  }
}

function apiErrorMessage(data: ApiJson, fallback = "알 수 없는 오류"): string {
  const err = data.error;
  return typeof err === "string" && err.trim() ? err : fallback;
}

function confidenceBadgeClass(c: string) {
  switch (c) {
    case "high":
      return "bg-green-100 text-green-800";
    case "medium":
      return "bg-amber-100 text-amber-800";
    case "low":
      return "bg-slate-200 text-slate-700";
    case "skip":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function PreviewPanel({
  extracted,
  editing,
  onChange,
}: {
  extracted: ExtractedAdmission;
  editing: boolean;
  onChange: (next: ExtractedAdmission) => void;
}) {
  if (!editing) {
    return (
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm space-y-2">
        <p>
          <span className="text-slate-500">연도</span> {extracted.year} ·{" "}
          <span className="text-slate-500">전형</span> {extracted.admission_type}{" "}
          · <span className="text-slate-500">닉네임</span> {extracted.nickname}
        </p>
        {(extracted.exam_score || extracted.gpa) && (
          <p className="text-slate-700">
            {extracted.exam_score && <>수능: {extracted.exam_score} </>}
            {extracted.gpa && <>· 내신: {extracted.gpa}</>}
          </p>
        )}
        {(extracted.test_scores || extracted.extra_activities) && (
          <p className="text-slate-600 text-xs">
            {extracted.test_scores}
            {extracted.test_scores && extracted.extra_activities ? " · " : ""}
            {extracted.extra_activities}
          </p>
        )}
        <ul className="space-y-1">
          {extracted.schools.map((s, i) => (
            <li key={i} className="text-slate-800">
              {s.univ_name} {s.dept_name}
              {s.is_accept ? " · 합격" : ""}
              {s.is_regist ? " · 등록" : ""}
            </li>
          ))}
        </ul>
        {extracted.review && (
          <p className="text-xs text-slate-600 line-clamp-4 whitespace-pre-wrap">
            {extracted.review}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-xs text-slate-500">연도</span>
          <input
            type="number"
            value={extracted.year}
            onChange={(e) =>
              onChange({ ...extracted, year: Number(e.target.value) })
            }
            className="w-full border rounded px-2 py-1"
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">전형</span>
          <input
            value={extracted.admission_type}
            onChange={(e) =>
              onChange({ ...extracted, admission_type: e.target.value })
            }
            className="w-full border rounded px-2 py-1"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs text-slate-500">닉네임</span>
        <input
          value={extracted.nickname}
          onChange={(e) => onChange({ ...extracted, nickname: e.target.value })}
          className="w-full border rounded px-2 py-1"
        />
      </label>
      <label className="block">
        <span className="text-xs text-slate-500">후기</span>
        <textarea
          value={extracted.review}
          onChange={(e) => onChange({ ...extracted, review: e.target.value })}
          rows={4}
          className="w-full border rounded px-2 py-1 text-xs"
        />
      </label>
      <p className="text-xs text-slate-500">
        학교 목록은 미리보기 후 「이대로 등록」을 권장합니다. 수정이 필요하면
        원본에서 확인 후 거부하거나 수동 등록하세요.
      </p>
    </div>
  );
}

function AdmissionsReviewInner() {
  const searchParams = useSearchParams();
  const keyFromUrl = searchParams.get("key") ?? "";
  const [key, setKey] = useState(keyFromUrl);
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, ExtractedAdmission>>({});
  const [previewOpen, setPreviewOpen] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkRunning, setBulkRunning] = useState(false);

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

  const loadPending = useCallback(async () => {
    if (!key.trim()) {
      setLoadErr("ADMIN_SECRET 또는 ?key= 로 키를 입력하세요.");
      return;
    }
    setLoading(true);
    setLoadErr(null);
    try {
      const res = await fetch("/api/admin/admission-posts/pending", {
        headers: hdrs(),
      });
      if (res.status === 401) {
        setLoadErr("키가 올바르지 않습니다.");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "로드 실패");
      const list = (data.posts ?? []) as PendingPost[];
      setPosts(list);
      setSelected(new Set());
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, [hdrs, key]);

  useEffect(() => {
    if (keyFromUrl.trim()) void loadPending();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function runPreview(postId: string) {
    setActionId(postId);
    try {
      const res = await fetch(`/api/admin/admission-posts/${postId}/preview`, {
        headers: hdrs(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "미리보기 실패");
      setPreviews((p) => ({ ...p, [postId]: data.extracted }));
      setPreviewOpen((o) => ({ ...o, [postId]: true }));
      setEditing((e) => ({ ...e, [postId]: false }));
    } catch (e) {
      alert(e instanceof Error ? e.message : "미리보기 오류");
    } finally {
      setActionId(null);
    }
  }

  async function migratePost(
    postId: string,
    overrides?: ExtractedAdmission
  ) {
    if (overrides?.confidence === "skip") {
      alert("skip 판정 글은 이관할 수 없습니다. 후보 제외를 사용하세요.");
      return;
    }
    setActionId(postId);
    try {
      const res = await fetch(`/api/admin/admission-posts/${postId}/migrate`, {
        method: "POST",
        headers: hdrs(true),
        body: JSON.stringify(overrides ? { overrides } : {}),
      });
      const data = await parseApiJson(res);

      if (res.ok && data.success) {
        alert(
          `✅ 합격DB로 이관 완료! admission_id: ${String(data.admission_id ?? "—")}` +
            (data.confidence ? ` (confidence: ${data.confidence})` : "")
        );
        setPreviewOpen((o) => ({ ...o, [postId]: false }));
        await loadPending();
      } else {
        let msg = apiErrorMessage(data);
        const step =
          typeof data.step === "string" && data.step ? `[${data.step}] ` : "";
        if (data.suggest_forum) {
          msg += "\n\n「포럼으로 이관」 버튼을 사용해 보세요.";
        }
        const extractedSnippet = data.extracted
          ? JSON.stringify(data.extracted, null, 2).slice(0, 500)
          : "";
        const stackHint =
          typeof data.stack === "string" && data.stack
            ? `\n\n${data.stack}`
            : "";
        alert(
          `❌ 이관 실패 (${res.status}) ${step}${msg}` +
            (extractedSnippet ? `\n\n추출 결과:\n${extractedSnippet}` : "") +
            stackHint
        );
        if (data.extracted && typeof data.extracted === "object") {
          setPreviews((p) => ({
            ...p,
            [postId]: data.extracted as ExtractedAdmission,
          }));
          setPreviewOpen((o) => ({ ...o, [postId]: true }));
        }
      }
    } catch (e) {
      alert(
        `❌ 네트워크 에러: ${e instanceof Error ? e.message : "오류"}`
      );
    } finally {
      setActionId(null);
    }
  }

  async function moveToForum(postId: string) {
    setActionId(postId);
    try {
      const res = await fetch(
        `/api/admin/admission-posts/${postId}/to-forum`,
        { method: "POST", headers: hdrs(true), body: JSON.stringify({}) }
      );
      const data = await parseApiJson(res);

      if (res.ok && data.success) {
        alert(
          `✅ 포럼 이관 완료 · 카테고리: ${String(data.category ?? "—")}\n${String(data.forum_url ?? "")}`
        );
        setPreviewOpen((o) => ({ ...o, [postId]: false }));
        setSelected((s) => {
          const next = new Set(s);
          next.delete(postId);
          return next;
        });
        await loadPending();
      } else {
        alert(
          `❌ 포럼 이관 실패 (${res.status}): ${apiErrorMessage(data, "포럼 이관 실패")}`
        );
      }
    } catch (e) {
      alert(
        `❌ 네트워크 에러: ${e instanceof Error ? e.message : "오류"}`
      );
    } finally {
      setActionId(null);
    }
  }

  async function bulkMoveToForum() {
    const ids = [...selected];
    if (ids.length === 0) {
      alert("선택한 글이 없습니다.");
      return;
    }
    if (!confirm(`${ids.length}건을 포럼으로 이관할까요?`)) return;
    setBulkRunning(true);
    try {
      const res = await fetch("/api/admin/admission-posts/bulk-to-forum", {
        method: "POST",
        headers: hdrs(true),
        body: JSON.stringify({ ids }),
      });
      const data = await parseApiJson(res);

      if (res.ok) {
        alert(
          `✅ 포럼 일괄 이관: 성공 ${String(data.ok ?? 0)}건 / 실패 ${String(data.failed ?? 0)}건`
        );
        setSelected(new Set());
        await loadPending();
      } else {
        alert(
          `❌ 일괄 이관 실패 (${res.status}): ${apiErrorMessage(data, "일괄 이관 실패")}`
        );
      }
    } catch (e) {
      alert(
        `❌ 네트워크 에러: ${e instanceof Error ? e.message : "오류"}`
      );
    } finally {
      setBulkRunning(false);
    }
  }

  function toggleSelect(postId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === posts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(posts.map((p) => p.id)));
    }
  }

  async function reject(postId: string) {
    if (!confirm("이 글을 합격DB 이관 후보에서 제외할까요?")) return;
    setActionId(postId);
    try {
      const res = await fetch(`/api/admin/admission-posts/${postId}/reject`, {
        method: "POST",
        headers: hdrs(),
      });
      const data = await parseApiJson(res);

      if (res.ok && data.success) {
        alert("✅ 후보에서 제외했습니다.");
        setPreviewOpen((o) => ({ ...o, [postId]: false }));
        await loadPending();
      } else {
        alert(
          `❌ 거부 실패 (${res.status}): ${apiErrorMessage(data, "거부 실패")}`
        );
      }
    } catch (e) {
      alert(
        `❌ 네트워크 에러: ${e instanceof Error ? e.message : "오류"}`
      );
    } finally {
      setActionId(null);
    }
  }

  const studyKoreaHref = key.trim()
    ? `/admin/study-korea?key=${encodeURIComponent(key.trim())}`
    : "/admin/study-korea";

  return (
    <div className="min-h-screen bg-slate-100 text-gray-900">
      <header className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold">
            합격 후기 검토 ({posts.length}개 대기)
          </h1>
          <Link
            href={studyKoreaHref}
            className="text-sm text-orange-600 hover:underline"
          >
            ← Study Korea Pipeline
          </Link>
        </div>
        <p className="max-w-4xl mx-auto mt-2 text-xs text-slate-600">
          합격DB / 포럼 / 거부 · low도 합격DB 이관 가능 · skip은 포럼 권장
        </p>
        <div className="max-w-4xl mx-auto mt-3 flex flex-wrap gap-2">
          <input
            type="password"
            placeholder="Admin secret"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="flex-1 min-w-[180px] border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void loadPending()}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm"
          >
            {loading ? "…" : "새로고침"}
          </button>
        </div>
        {loadErr && (
          <p className="max-w-4xl mx-auto mt-2 text-red-600 text-sm">{loadErr}</p>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {posts.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={selected.size === posts.length && posts.length > 0}
                onChange={toggleSelectAll}
              />
              전체 선택 ({selected.size}/{posts.length})
            </label>
            <button
              type="button"
              disabled={bulkRunning || selected.size === 0 || actionId !== null}
              onClick={() => void bulkMoveToForum()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {bulkRunning
                ? "일괄 이관 중…"
                : `선택 ${selected.size}건 포럼으로 이관`}
            </button>
          </div>
        )}

        {posts.map((post) => {
          const extracted = previews[post.id];
          const showPreview = previewOpen[post.id] && extracted;
          const isEditing = editing[post.id];

          return (
            <article
              key={post.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex items-start gap-2 min-w-0">
                  <input
                    type="checkbox"
                    className="mt-1.5 shrink-0"
                    checked={selected.has(post.id)}
                    onChange={() => toggleSelect(post.id)}
                  />
                  <h3 className="font-bold text-lg">{post.title}</h3>
                </div>
                <span className="text-xs text-slate-500 shrink-0">
                  {post.source}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-3 line-clamp-3">
                {post.content}
              </p>
              {post.url && (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-orange-600 hover:underline"
                >
                  원본 보기 →
                </a>
              )}

              {showPreview && extracted && (
                <div className="mt-3">
                  <span
                    className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${confidenceBadgeClass(extracted.confidence)}`}
                  >
                    confidence: {extracted.confidence}
                  </span>
                  <PreviewPanel
                    extracted={extracted}
                    editing={isEditing}
                    onChange={(next) =>
                      setPreviews((p) => ({ ...p, [post.id]: next }))
                    }
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => void runPreview(post.id)}
                  disabled={actionId !== null}
                  className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium"
                >
                  {actionId === post.id && !showPreview
                    ? "추출 중…"
                    : "미리보기"}
                </button>
                {showPreview && extracted && (
                  <>
                    <button
                      type="button"
                      onClick={() => void migratePost(post.id, extracted)}
                      disabled={actionId !== null}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium"
                    >
                      이대로 등록
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditing((e) => ({
                          ...e,
                          [post.id]: !e[post.id],
                        }))
                      }
                      disabled={actionId !== null}
                      className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm"
                    >
                      {isEditing ? "미리보기" : "수정 후 등록"}
                    </button>
                  </>
                )}
                {!showPreview && (
                  <button
                    type="button"
                    onClick={() => void migratePost(post.id)}
                    disabled={actionId !== null}
                    className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm"
                  >
                    합격DB 이관 (AI)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void moveToForum(post.id)}
                  disabled={actionId !== null}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium"
                >
                  {actionId === post.id ? "처리 중…" : "포럼으로 이관"}
                </button>
                <button
                  type="button"
                  onClick={() => void reject(post.id)}
                  disabled={actionId !== null}
                  className="bg-slate-200 hover:bg-slate-300 disabled:opacity-50 px-3 py-2 rounded-lg text-sm"
                >
                  거부
                </button>
              </div>
            </article>
          );
        })}

        {!loading && posts.length === 0 && !loadErr && (
          <p className="text-slate-500 text-center py-12">
            검토 대기 중인 합격 후기가 없습니다
          </p>
        )}
      </main>
    </div>
  );
}

export default function AdmissionsReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 p-6 text-slate-600">로딩…</div>
      }
    >
      <AdmissionsReviewInner />
    </Suspense>
  );
}
