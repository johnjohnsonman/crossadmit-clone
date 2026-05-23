"use client";

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

export type DcComment = {
  id: string;
  admission_id: number;
  nickname: string;
  content: string;
  created_at: string;
};

export type Props = {
  admissionId: number | string;
};

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  if (diff < 60_000) return "방금";
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function CommentSection({ admissionId: admissionIdProp }: Props) {
  const admissionId = String(admissionIdProp);
  const [comments, setComments] = useState<DcComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [nick, setNick] = useState("");
  const [pw, setPw] = useState("");
  const [body, setBody] = useState("");
  const [postErr, setPostErr] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const [openDeleteId, setOpenDeleteId] = useState<string | null>(null);
  const [delPw, setDelPw] = useState("");
  const [delErr, setDelErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const encId = useMemo(
    () => encodeURIComponent(admissionId),
    [admissionId]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setLoadErr(null);
    try {
      const res = await fetch(`/api/admissions/${encId}/comments`);
      if (!res.ok) throw new Error("불러오기 실패");
      const list = (await res.json()) as DcComment[];
      setComments(Array.isArray(list) ? list : []);
    } catch {
      setLoadErr("댓글을 불러오지 못했습니다.");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [encId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    setPostErr(null);
    if (body.trim().length < 2) {
      setPostErr("댓글은 2자 이상 입력해주세요.");
      return;
    }
    if (!pw.trim()) {
      setPostErr("삭제용 비밀번호를 입력해주세요.");
      return;
    }
    setPosting(true);
    try {
      const res = await fetch(`/api/admissions/${encId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nick.trim() || "익명",
          password: pw.trim(),
          content: body.trim(),
        }),
      });
      const data = (await res.json()) as DcComment & { error?: string };
      if (!res.ok) {
        setPostErr(data.error ?? "등록에 실패했습니다.");
        return;
      }
      setComments((prev) => [...prev, data]);
      setBody("");
      setPw("");
    } catch {
      setPostErr("네트워크 오류입니다.");
    } finally {
      setPosting(false);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void submit();
    }
  }

  async function confirmDelete(commentId: string) {
    setDelErr(null);
    if (!delPw.trim()) {
      setDelErr("비밀번호를 입력하세요.");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: delPw.trim() }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) {
        setDelErr(j.error ?? "삭제에 실패했습니다.");
        return;
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setOpenDeleteId(null);
      setDelPw("");
    } catch {
      setDelErr("네트워크 오류입니다.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section>
      <h2 className="text-sm font-semibold tracking-tight text-white">
        댓글
      </h2>

      <div className="mt-3 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
        {loading ? (
          <p className="text-sm text-gray-500">불러오는 중…</p>
        ) : loadErr ? (
          <p className="text-sm text-red-600">{loadErr}</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-500">첫 댓글을 남겨보세요.</p>
        ) : (
          <ul className="divide-y divide-gray-800">
            {comments.map((c) => (
              <li key={c.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-white">
                      {c.nickname}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(c.created_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {openDeleteId === c.id ? (
                      <div className="flex flex-wrap items-center gap-1">
                        <input
                          type="password"
                          className="w-28 rounded border border-gray-700 bg-gray-800 text-white px-2 py-1 text-xs"
                          placeholder="비밀번호"
                          value={delPw}
                          onChange={(e) => setDelPw(e.target.value)}
                        />
                        <button
                          type="button"
                          className="rounded bg-gray-800 px-2 py-1 text-xs text-white"
                          disabled={deleting}
                          onClick={() => void confirmDelete(c.id)}
                        >
                          확인
                        </button>
                        <button
                          type="button"
                          className="text-xs text-gray-500 underline"
                          onClick={() => {
                            setOpenDeleteId(null);
                            setDelPw("");
                            setDelErr(null);
                          }}
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="text-xs text-gray-500 hover:text-red-600"
                        onClick={() => {
                          setOpenDeleteId(c.id);
                          setDelPw("");
                          setDelErr(null);
                        }}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
                {openDeleteId === c.id && delErr ? (
                  <p className="mt-1 text-xs text-red-600">{delErr}</p>
                ) : null}
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-300">
                  {c.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        onSubmit={submit}
        className="mt-4 space-y-2 rounded-lg border border-gray-800 bg-gray-900 p-4"
      >
        {postErr ? (
          <p className="text-sm text-red-600">{postErr}</p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            className="flex-1 rounded border border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="익명"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
          />
          <input
            type="password"
            className="flex-1 rounded border border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="삭제용 비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <textarea
            className="min-h-[88px] flex-1 rounded border border-gray-700 bg-gray-800 text-white placeholder:text-gray-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="댓글을 입력하세요...  Ctrl+Enter로 등록"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button
            type="submit"
            disabled={posting}
            className="shrink-0 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {posting ? "등록 중…" : "등록"}
          </button>
        </div>
      </form>
    </section>
  );
}
