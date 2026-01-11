"use client";

import { useState } from "react";

export default function AutoScrapeButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    scraped?: number;
    generated?: number;
    total?: number;
    new?: number;
    error?: string;
  } | null>(null);

  const handleScrape = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // 페이지 새로고침하여 최신 데이터 표시
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-sage-200 p-6">
      <h3 className="text-lg font-medium text-sage-800 mb-4">
        자동 데이터 수집
      </h3>
      <p className="text-sm text-sage-600 mb-4">
        crossadmit.com에서 최신 합격자 데이터를 수집하고 가상 데이터를 생성합니다.
      </p>
      <button
        onClick={handleScrape}
        disabled={loading}
        className={`px-6 py-2 rounded-md font-medium transition-colors ${
          loading
            ? "bg-sage-300 text-sage-600 cursor-not-allowed"
            : "bg-tea-600 text-white hover:bg-tea-700"
        }`}
      >
        {loading ? "수집 중..." : "데이터 수집 시작"}
      </button>

      {result && (
        <div
          className={`mt-4 p-4 rounded-lg ${
            result.success
              ? "bg-tea-50 border border-tea-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {result.success ? (
            <div>
              <p className="text-sm font-medium text-tea-800 mb-2">
                ✓ 데이터 수집 완료
              </p>
              <div className="text-sm text-tea-700 space-y-1">
                <p>웹 수집: {result.scraped}개</p>
                <p>가상 생성: {result.generated}개</p>
                <p>전체 데이터: {result.total}개</p>
                <p>신규 추가: {result.new}개</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-red-800 mb-2">
                ✗ 데이터 수집 실패
              </p>
              <p className="text-sm text-red-700">{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


