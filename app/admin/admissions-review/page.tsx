"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type PendingPost = {
  id: string;
  title: string;
  content: string | null;
  url: string | null;
  source: string;
  created_at: string;
};

function AdmissionsReviewInner() {
  const searchParams = useSearchParams();
  const keyFromUrl = searchParams.get("key") ?? "";
  const [key, setKey] = useState(keyFromUrl);
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (keyFromUrl && keyFromUrl !== key) setKey(keyFromUrl);
  }, [keyFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const hdrs = useCallback(
    (): HeadersInit => ({
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
      setPosts(data.posts ?? []);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, [hdrs, key]);

  useEffect(() => {
    if (keyFromUrl.trim()) void loadPending();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function migrateToAdmissions(postId: string) {
    setActionId(postId);
    try {
      const res = await fetch(
        `/api/admin/admission-posts/${postId}/migrate`,
        { method: "POST", headers: hdrs() }
      );
      const data = await res.json();
      if (data.success) {
        alert(`합격DB로 이관 완료! admission_id: ${data.admission_id}`);
        await loadPending();
      } else {
        alert(`실패: ${data.error ?? "unknown"}`);
      }
    } finally {
      setActionId(null);
    }
  }

  async function reject(postId: string) {
    if (!confirm("이 글을 합격DB 이관 후보에서 제외할까요?")) return;
    setActionId(postId);
    try {
      await fetch(`/api/admin/admission-posts/${postId}/reject`, {
        method: "POST",
        headers: hdrs(),
      });
      await loadPending();
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
        {posts.map((post) => (
          <article
            key={post.id}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
          >
            <div className="flex justify-between items-start gap-2 mb-2">
              <h3 className="font-bold text-lg">{post.title}</h3>
              <span className="text-xs text-slate-500 shrink-0">{post.source}</span>
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
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                onClick={() => void migrateToAdmissions(post.id)}
                disabled={actionId !== null}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {actionId === post.id ? "처리 중…" : "합격DB로 이관 (AI 추출)"}
              </button>
              <button
                type="button"
                onClick={() => void reject(post.id)}
                disabled={actionId !== null}
                className="bg-slate-200 hover:bg-slate-300 disabled:opacity-50 px-4 py-2 rounded-lg text-sm"
              >
                후보 제외
              </button>
            </div>
          </article>
        ))}

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
