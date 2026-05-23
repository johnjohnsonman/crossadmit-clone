"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { MentorRow } from "@/lib/mentors/types";
import { mentorUniversityName } from "@/lib/mentors/display";

function InactiveMentorsInner() {
  const searchParams = useSearchParams();
  const keyFromUrl = searchParams.get("key") ?? "";
  const [key, setKey] = useState(keyFromUrl);
  const [mentors, setMentors] = useState<MentorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const hdrs = useCallback(
    (): HeadersInit => ({
      "Content-Type": "application/json",
      ...(key.trim() ? { "x-admin-secret": key.trim() } : {}),
    }),
    [key]
  );

  const load = useCallback(async () => {
    if (!key.trim()) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/mentors/inactive", { headers: hdrs() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Load failed");
      setMentors(json.mentors ?? []);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, [key, hdrs]);

  useEffect(() => {
    if (keyFromUrl) void load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function patch(id: string, action: "activate" | "hide") {
    try {
      const res = await fetch("/api/admin/mentors/inactive", {
        method: "PATCH",
        headers: hdrs(),
        body: JSON.stringify({ id, action }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Update failed");
      setMentors((prev) => prev.filter((m) => m.id !== id));
      setMsg(action === "activate" ? "활성화됨" : "숨김 처리됨");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/admin/study-korea?key=${encodeURIComponent(key)}`}
          className="text-sm text-orange-400 hover:text-orange-300 hover:underline"
        >
          ← Study Korea Admin
        </Link>
        <h1 className="text-2xl font-bold mt-4 mb-2">비활성 멘토 검토</h1>
        <p className="text-sm text-gray-600 mb-4">
          비공개 멘토 프로필을 검토하고 활성화하거나 숨길 수 있습니다.
        </p>
        <div className="flex gap-2 mb-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Admin secret"
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void load()}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm"
          >
            {loading ? "…" : "불러오기"}
          </button>
        </div>
        {msg && (
          <p className="text-sm mb-4 p-2 bg-white rounded border">{msg}</p>
        )}
        <ul className="space-y-3">
          {mentors.map((m) => (
            <li
              key={m.id}
              className="bg-white rounded-lg border p-4 shadow-sm"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-bold">{m.nickname}</p>
                  <p className="text-sm text-gray-600">
                    {mentorUniversityName(m, "ko")}
                    {m.legacy_id ? ` · legacy #${m.legacy_id}` : ""}
                  </p>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-3">
                    {m.intro_kr}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void patch(m.id, "activate")}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg"
                  >
                    Activate
                  </button>
                  <button
                    type="button"
                    onClick={() => void patch(m.id, "hide")}
                    className="px-3 py-1.5 bg-gray-500 text-white text-sm rounded-lg"
                  >
                    Hide
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {!loading && mentors.length === 0 && key.trim() && (
          <p className="text-center text-gray-500 py-8">비활성 멘토 없음</p>
        )}
      </div>
    </div>
  );
}

export default function InactiveMentorsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading…</div>}>
      <InactiveMentorsInner />
    </Suspense>
  );
}
