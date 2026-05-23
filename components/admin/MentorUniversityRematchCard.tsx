"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Stats = {
  total: number;
  matched: number;
  unmatched: number;
  match_rate: number;
};

type Props = {
  adminKey: string;
};

export default function MentorUniversityRematchCard({ adminKey }: Props) {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    matched: 0,
    unmatched: 0,
    match_rate: 0,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const stopRef = useRef(false);

  const hdrs = useCallback((): HeadersInit => {
    const h: HeadersInit = { "Content-Type": "application/json" };
    if (adminKey.trim()) h["x-admin-secret"] = adminKey.trim();
    return h;
  }, [adminKey]);

  const loadStats = useCallback(async () => {
    if (!adminKey.trim()) return;
    try {
      const res = await fetch("/api/admin/mentors/rematch-universities", {
        headers: hdrs(),
      });
      if (res.status === 401) return;
      const data = await res.json();
      if (data.success !== false && !data.error) {
        setStats({
          total: data.total ?? 0,
          matched: data.matched ?? 0,
          unmatched: data.unmatched ?? 0,
          match_rate: data.match_rate ?? 0,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, [adminKey, hdrs]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const addLog = (line: string) => {
    setLogs((prev) => [...prev, line].slice(-50));
  };

  const runBatch = async () => {
    const res = await fetch("/api/admin/mentors/rematch-universities", {
      method: "POST",
      headers: hdrs(),
    });
    const text = await res.text();

    let data: {
      success?: boolean;
      error?: string;
      processed?: number;
      matched_high?: number;
      matched_medium?: number;
      matched_low?: number;
      no_match?: number;
      remaining?: number;
      message?: string;
      details?: {
        nickname: string;
        matched?: string | null;
        confidence: string;
        applied?: boolean;
        error?: string;
        note?: string;
      }[];
    };

    try {
      data = JSON.parse(text);
    } catch {
      addLog(`❌ JSON 파싱 실패: ${text.slice(0, 100)}`);
      return { success: false, processed: 0, remaining: stats.unmatched };
    }

    if (data.message && data.processed === 0) {
      addLog(`ℹ️ ${data.message}`);
      return { success: true, processed: 0, remaining: data.remaining ?? 0 };
    }

    if (!res.ok || data.success === false) {
      addLog(`❌ ${data.error || "알 수 없는 에러"}`);
      return { success: false, processed: 0, remaining: stats.unmatched };
    }

    addLog(`━━━ 배치 완료: ${data.processed ?? 0}건 처리 ━━━`);
    addLog(
      `   High: ${data.matched_high ?? 0} / Medium: ${data.matched_medium ?? 0} / Low: ${data.matched_low ?? 0} / No match: ${data.no_match ?? 0}`
    );

    for (const d of data.details ?? []) {
      if (d.applied) {
        const icon = d.confidence === "high" ? "✅" : "✓";
        addLog(`${icon} ${d.nickname} → ${d.matched} (${d.confidence})`);
      } else if (d.error) {
        addLog(`❌ ${d.nickname} - ${d.error}`);
      } else if (d.confidence === "low" || d.note) {
        addLog(`⚠️ ${d.nickname} → ${d.matched ?? "?"} (${d.note ?? "low"})`);
      } else {
        addLog(`⚪ ${d.nickname} - no school found`);
      }
    }

    return {
      success: true,
      processed: data.processed ?? 0,
      remaining: data.remaining ?? 0,
    };
  };

  const runOnce = async () => {
    setIsRunning(true);
    setLogs([]);
    stopRef.current = false;
    addLog("🚀 10개 매칭 시작...");
    await runBatch();
    await loadStats();
    setIsRunning(false);
  };

  const runAll = async () => {
    setIsRunning(true);
    setLogs([]);
    stopRef.current = false;
    addLog("🚀 전체 자동 매칭 시작...");

    let safetyCounter = 0;
    while (!stopRef.current && safetyCounter < 30) {
      const result = await runBatch();
      safetyCounter++;

      if (!result.success || result.processed === 0 || result.remaining === 0) {
        break;
      }

      await loadStats();
      await new Promise((r) => setTimeout(r, 2000));
    }

    addLog("🏁 전체 매칭 종료");
    await loadStats();
    setIsRunning(false);
  };

  const stop = () => {
    stopRef.current = true;
    addLog("⏹ 사용자가 중지 요청");
  };

  return (
    <div className="rounded-xl border border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 shadow-sm mb-6">
      <h2 className="text-sm font-bold text-indigo-900 mb-2">
        🎓 멘토 학교 자동 매칭 (AI)
      </h2>
      <p className="text-sm text-indigo-800 mb-4">
        자기소개에서 학교 정보를 Claude Haiku로 분석하여 universities 테이블에
        자동 매칭합니다.
      </p>

      <div className="bg-white/70 rounded-lg border border-indigo-200 p-3 mb-4">
        <div className="flex justify-between text-sm text-indigo-900 mb-2">
          <span>매칭 진행률</span>
          <span className="font-mono font-semibold">
            {stats.matched} / {stats.total} ({stats.match_rate}%)
          </span>
        </div>
        <div className="w-full bg-indigo-100 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${stats.match_rate}%` }}
          />
        </div>
        <p className="text-xs text-indigo-700 mt-2">미매칭: {stats.unmatched}명</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => void runOnce()}
          disabled={isRunning || stats.unmatched === 0 || !adminKey.trim()}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          ▶ 10개 매칭
        </button>
        <button
          type="button"
          onClick={() => void runAll()}
          disabled={isRunning || stats.unmatched === 0 || !adminKey.trim()}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50"
        >
          {isRunning ? "실행 중…" : "▶▶ 전체 자동 매칭"}
        </button>
        <button
          type="button"
          onClick={stop}
          disabled={!isRunning}
          className="px-4 py-2 rounded-lg bg-white border border-indigo-300 text-indigo-900 text-sm disabled:opacity-50"
        >
          ⏹ 중지
        </button>
      </div>

      {logs.length > 0 && (
        <div className="bg-slate-900 rounded-lg p-3 max-h-64 overflow-y-auto text-xs font-mono space-y-0.5">
          {logs.map((log, i) => (
            <div
              key={`${i}-${log.slice(0, 20)}`}
              className={
                log.startsWith("✅") || log.startsWith("✓")
                  ? "text-green-400"
                  : log.startsWith("❌")
                    ? "text-red-400"
                    : log.startsWith("⚠️")
                      ? "text-yellow-400"
                      : log.startsWith("🏁") || log.startsWith("━━━")
                        ? "text-indigo-300"
                        : "text-gray-300"
              }
            >
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
