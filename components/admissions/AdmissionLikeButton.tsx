"use client";

import { useEffect, useState } from "react";

const LIKED_LS = "adliked:";

type Props = {
  admissionId: number;
  initialCount: number;
  variant?: "compact" | "detail";
};

export default function AdmissionLikeButton({
  admissionId,
  initialCount,
  variant = "compact",
}: Props) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    try {
      setLiked(localStorage.getItem(LIKED_LS + String(admissionId)) === "1");
    } catch {
      setLiked(false);
    }
  }, [admissionId]);

  const onClick = async () => {
    if (liked || busy) return;
    const prev = count;
    setBusy(true);
    setCount((c) => c + 1);
    try {
      const res = await fetch(
        `/api/admissions/${encodeURIComponent(admissionId)}/like`,
        { method: "POST", credentials: "include" }
      );
      const data = (await res.json()) as { likes_count?: number; error?: string };
      if (!res.ok) throw new Error(data.error || "fail");
      if (typeof data.likes_count === "number") setCount(data.likes_count);
      setLiked(true);
      try {
        localStorage.setItem(LIKED_LS + String(admissionId), "1");
      } catch {
        /* ignore */
      }
    } catch {
      setCount(prev);
    } finally {
      setBusy(false);
    }
  };

  if (variant === "detail") {
    return (
      <button
        type="button"
        disabled={liked || busy}
        onClick={() => void onClick()}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-4 py-2 text-sm font-medium text-gray-200 hover:border-orange-500/40 hover:bg-gray-800 disabled:opacity-60 transition-colors"
      >
        <span aria-hidden>👍</span>
        공감하기 {count > 0 && <span className="text-gray-400">({count})</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={liked || busy}
      onClick={() => void onClick()}
      className="text-sm text-[#7C7C7C] hover:text-orange-400 disabled:opacity-60 tabular-nums"
      title="공감"
    >
      👍 {count}
    </button>
  );
}
