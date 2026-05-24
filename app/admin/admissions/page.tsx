"use client";

import {
  Fragment,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import {
  ADMIT_TRACK_VALUES,
  ADMIT_TRACK_LABEL,
  SOURCE_TYPE_VALUES,
  type AdmitTrack,
  type SourceType,
} from "@/lib/admissions/admit-track";

type AdminAdmission = {
  id: number;
  title: string;
  user_handle: string;
  year: number;
  published: boolean | null;
  likes_count?: number | null;
  is_featured?: boolean | null;
  admit_track?: string | null;
  source_type?: string | null;
};

type AdminComment = {
  id: string;
  nickname: string;
  content: string;
  is_deleted: boolean | null;
  created_at: string;
};

function shortId(id: number): string {
  return String(id);
}

function AdminInner() {
  const searchParams = useSearchParams();
  const keyFromUrl = searchParams.get("key") ?? "";

  const [key, setKey] = useState(keyFromUrl);
  const [authorized, setAuthorized] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminAdmission[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  /** admission_id → 댓글 */
  const [commentsByAdmission, setCommentsByAdmission] = useState<
    Record<string, AdminComment[] | "loading">
  >({});
  const [openId, setOpenId] = useState<string | null>(null);

  const [likesDraft, setLikesDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [filterTrack, setFilterTrack] = useState<string>("");
  const [filterSource, setFilterSource] = useState<string>("");

  useEffect(() => {
    if (keyFromUrl && keyFromUrl !== key) {
      setKey(keyFromUrl);
    }
  }, [keyFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps -- URL만 동기화

  const qp = useMemo(() => {
    const s = key.trim();
    return s ? `?key=${encodeURIComponent(s)}` : "";
  }, [key]);

  const hdrs = useCallback(
    (json = false): HeadersInit => ({
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(key.trim()
        ? { "x-admin-secret": key.trim() }
        : ({} as Record<string, never>)),
    }),
    [key],
  );

  const loadAll = useCallback(async () => {
    if (!key.trim()) {
      setLoadErr("ADMIN_SECRET 또는 ?key= 로 키를 입력하세요.");
      return;
    }
    setLoading(true);
    setLoadErr(null);
    try {
      const res = await fetch(`/api/admin/admissions${qp}`, {
        headers: hdrs(false),
      });
      if (res.status === 401) {
        setAuthorized(false);
        setLoadErr("키가 올바르지 않거나 ADMIN_SECRET 미설정입니다.");
        setRows([]);
        setCounts({});
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "목록 로드 실패");
      }
      setAuthorized(true);
      setRows(json.admissions ?? []);
      setCounts(json.commentCounts ?? {});
    } catch (e) {
      setAuthorized(false);
      setLoadErr(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, [qp, hdrs, key]);

  useEffect(() => {
    if (keyFromUrl.trim()) void loadAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- 최초 URL 키로 1회

  const toggleOpen = async (id: string) => {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (commentsByAdmission[id] !== undefined) return;
    setCommentsByAdmission((m) => ({ ...m, [id]: "loading" }));
    try {
      const res = await fetch(
        `/api/admin/comments${qp}&admission_id=${encodeURIComponent(id)}`,
        { headers: hdrs(false) },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "댓글 로드 실패");
      const list = (json.comments ?? []) as AdminComment[];
      setCommentsByAdmission((m) => ({ ...m, [id]: list }));
    } catch {
      setCommentsByAdmission((m) => ({ ...m, [id]: [] }));
    }
  };

  const patchField = async (id: string, field: string, value: unknown) => {
    if (!key.trim()) return;
    setSaving(`${id}:${field}`);
    try {
      const res = await fetch(`/api/admin/update${qp}`, {
        method: "PATCH",
        headers: hdrs(true),
        body: JSON.stringify({ id, field, value }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "저장 실패");
      await loadAll();
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSaving(null);
    }
  };

  const deleteCommentAdmin = async (commentId: string, admissionId: string) => {
    if (!key.trim()) return;
    try {
      const res = await fetch(`/api/admin/comments/${commentId}${qp}`, {
        method: "DELETE",
        headers: hdrs(false),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "삭제 실패");
      const cur = commentsByAdmission[admissionId];
      const wasLive =
        Array.isArray(cur) && cur.some((c) => c.id === commentId && !c.is_deleted);
      if (Array.isArray(cur)) {
        setCommentsByAdmission((m) => ({
          ...m,
          [admissionId]: cur.map((c) =>
            c.id === commentId ? { ...c, is_deleted: true } : c,
          ),
        }));
      }
      if (wasLive) {
        setCounts((c) => ({
          ...c,
          [admissionId]: Math.max(0, (c[admissionId] ?? 0) - 1),
        }));
      }
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "삭제 오류");
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (filterTrack && r.admit_track !== filterTrack) return false;
      if (filterSource && r.source_type !== filterSource) return false;
      return true;
    });
  }, [rows, filterTrack, filterSource]);

  const onSaveLikes = (id: string) => {
    const raw = (likesDraft[id] ?? "").trim();
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 0) {
      setLoadErr("공감수는 0 이상 정수입니다.");
      return;
    }
    void patchField(id, "likes_count", n);
  };

  return (
    <main className="min-h-screen bg-[#fafafa] p-6 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold">합격 DB 어드민</h1>
        <p className="mt-2 text-sm text-gray-600">
          URL에{" "}
          <code className="rounded bg-gray-200 px-1">?key=비밀번호</code>로
          들어오거나 아래에 키를 입력한 뒤 불러오기를 누르세요. (
          <code className="rounded bg-gray-200 px-1">ADMIN_SECRET</code> 과
          일치해야 합니다.)
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded border border-gray-200 bg-white p-4 shadow-sm">
          <input
            type="password"
            className="min-w-[200px] flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="ADMIN_SECRET 또는 ?key= 값"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <button
            type="button"
            className="rounded bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
            onClick={() => void loadAll()}
          >
            불러오기
          </button>
        </div>

        {loadErr ? (
          <p className="mt-3 text-sm text-red-600">{loadErr}</p>
        ) : null}

        {loading ? (
          <p className="mt-8 text-gray-500">목록 불러오는 중…</p>
        ) : authorized && rows.length === 0 ? (
          <p className="mt-8 text-gray-500">데이터 없음</p>
        ) : authorized ? (
          <>
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded border border-gray-200 bg-white p-3 text-sm">
            <label className="flex items-center gap-2">
              <span className="text-gray-600">admit_track</span>
              <select
                className="rounded border border-gray-300 px-2 py-1"
                value={filterTrack}
                onChange={(e) => setFilterTrack(e.target.value)}
              >
                <option value="">전체</option>
                {ADMIT_TRACK_VALUES.map((v) => (
                  <option key={v} value={v}>
                    {ADMIT_TRACK_LABEL[v].ko}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-gray-600">source_type</span>
              <select
                className="rounded border border-gray-300 px-2 py-1"
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
              >
                <option value="">전체</option>
                {SOURCE_TYPE_VALUES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <span className="text-gray-500">
              표시 {filteredRows.length} / {rows.length}
            </span>
          </div>
          <div className="mt-6 overflow-x-auto rounded border border-gray-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="p-3 font-semibold">ID</th>
                  <th className="p-3 font-semibold">제목</th>
                  <th className="p-3 font-semibold">닉네임</th>
                  <th className="p-3 font-semibold">연도</th>
                  <th className="p-3 font-semibold">admit_track</th>
                  <th className="p-3 font-semibold">source_type</th>
                  <th className="p-3 font-semibold">공개</th>
                  <th className="p-3 font-semibold">공감수</th>
                  <th className="p-3 font-semibold">오늘의DB</th>
                  <th className="p-3 font-semibold">댓글수</th>
                  <th className="p-3 font-semibold">열기</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => {
                  const lc =
                    typeof r.likes_count === "number" ? r.likes_count : 0;
                  const lcStr =
                    likesDraft[r.id] !== undefined
                      ? likesDraft[r.id]
                      : String(lc ?? 0);
                  const savingFor = saving?.startsWith(`${r.id}:`) ? saving : null;
                  const com = counts[r.id] ?? 0;
                  const exp = commentsByAdmission[r.id];
                  const isOpen = openId === r.id;

                  return (
                    <Fragment key={r.id}>
                      <tr
                        className="border-b border-gray-100 align-top hover:bg-gray-50/80"
                      >
                        <td className="max-w-[7rem] p-3 font-mono text-xs">
                          {shortId(r.id)}
                        </td>
                        <td className="p-3 max-w-xs truncate">{r.title}</td>
                        <td className="p-3">{r.user_handle}</td>
                        <td className="p-3">{r.year}</td>
                        <td className="p-3 min-w-[9rem]">
                          <select
                            className="w-full max-w-[10rem] rounded border border-gray-300 px-1 py-1 text-xs"
                            value={r.admit_track ?? "regular_kr"}
                            disabled={savingFor === `${r.id}:admit_track`}
                            onChange={(e) =>
                              void patchField(
                                r.id,
                                "admit_track",
                                e.target.value as AdmitTrack,
                              )
                            }
                          >
                            {ADMIT_TRACK_VALUES.map((v) => (
                              <option key={v} value={v}>
                                {ADMIT_TRACK_LABEL[v].ko}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 min-w-[8rem]">
                          <select
                            className="w-full max-w-[9rem] rounded border border-gray-300 px-1 py-1 text-xs"
                            value={r.source_type ?? "mysql_original"}
                            disabled={savingFor === `${r.id}:source_type`}
                            onChange={(e) =>
                              void patchField(
                                r.id,
                                "source_type",
                                e.target.value as SourceType,
                              )
                            }
                          >
                            {SOURCE_TYPE_VALUES.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <label className="inline-flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-orange-500"
                              checked={Boolean(r.published)}
                              disabled={savingFor === `${r.id}:published`}
                              onChange={(e) =>
                                void patchField(
                                  r.id,
                                  "published",
                                  e.target.checked,
                                )
                              }
                            />
                            <span className="sr-only">공개 여부</span>
                          </label>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              className="w-16 rounded border border-gray-300 px-2 py-1 text-xs"
                              value={lcStr}
                              disabled={savingFor === `${r.id}:likes_count`}
                              onChange={(e) =>
                                setLikesDraft((m) => ({
                                  ...m,
                                  [r.id]: e.target.value,
                                }))
                              }
                            />
                            <button
                              type="button"
                              className="rounded border border-orange-500 px-2 py-1 text-xs text-orange-900 hover:bg-orange-50"
                              disabled={savingFor === `${r.id}:likes_count`}
                              onClick={() => onSaveLikes(r.id)}
                            >
                              저장
                            </button>
                          </div>
                        </td>
                        <td className="p-3">
                          <label className="inline-flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-amber-600"
                              checked={Boolean(r.is_featured)}
                              disabled={savingFor === `${r.id}:is_featured`}
                              onChange={(e) =>
                                void patchField(
                                  r.id,
                                  "is_featured",
                                  e.target.checked,
                                )
                              }
                            />
                            <span className="text-xs text-gray-500">핀</span>
                          </label>
                        </td>
                        <td className="p-3">{com}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            className="text-xs text-orange-600 underline"
                            onClick={() => void toggleOpen(r.id)}
                          >
                            {isOpen ? "접기" : "댓글"}
                          </button>
                        </td>
                      </tr>
                      {isOpen ? (
                        <tr className="border-b bg-[#f9f9f9]">
                          <td colSpan={11} className="p-4">
                            {exp === "loading" ? (
                              <p className="text-sm text-gray-500">댓글 로딩…</p>
                            ) : Array.isArray(exp) && exp.length === 0 ? (
                              <p className="text-sm text-gray-500">댓글 없음</p>
                            ) : Array.isArray(exp) ? (
                              <ul className="space-y-2">
                                {exp.map((c) => (
                                  <li
                                    key={c.id}
                                    className="flex flex-wrap items-start justify-between gap-2 rounded border border-gray-200 bg-white p-3 text-xs"
                                  >
                                    <div>
                                      <span className="font-semibold">
                                        {c.nickname}
                                      </span>
                                      <span className="ml-2 text-gray-400">
                                        {new Date(c.created_at).toLocaleString(
                                          "ko-KR",
                                        )}
                                      </span>
                                      {c.is_deleted ? (
                                        <span className="ml-2 text-red-600">
                                          (삭제됨)
                                        </span>
                                      ) : null}
                                      <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-gray-800">
                                        {c.content}
                                      </pre>
                                    </div>
                                    {!c.is_deleted ? (
                                      <button
                                        type="button"
                                        className="shrink-0 rounded bg-red-50 px-2 py-1 text-red-700 hover:bg-red-100"
                                        onClick={() =>
                                          void deleteCommentAdmin(c.id, r.id)
                                        }
                                      >
                                        삭제
                                      </button>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        ) : null}
      </div>
    </main>
  );
}

export default function AdminAdmissionsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen p-8 text-gray-500">로딩…</main>
      }
    >
      <AdminInner />
    </Suspense>
  );
}
