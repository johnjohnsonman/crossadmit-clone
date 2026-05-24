"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import CrossadmitComparisonResult from "@/components/crossadmit/CrossadmitComparisonResult";
import type { CrossComparePayload } from "@/lib/crossadmit/comparison-data";
import {
  formatSchoolKeyLabel,
  parseComparisonId,
} from "@/lib/crossadmit/comparison-utils";
import { withLang } from "@/lib/i18n/locale";

function CrossAdmitDetailInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const comparisonId = (params.id as string) || "";
  const locale = searchParams.get("lang") === "en" ? "en" : "ko";

  const [data, setData] = useState<CrossComparePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [legacyLabels, setLegacyLabels] = useState<{
    a: string;
    b: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLegacyLabels(null);
      setData(null);

      const parsed = parseComparisonId(comparisonId);
      if (!parsed) {
        setLoading(false);
        return;
      }

      if (parsed.kind === "legacy_keys") {
        setLegacyLabels({
          a: formatSchoolKeyLabel(parsed.keyA, locale),
          b: formatSchoolKeyLabel(parsed.keyB, locale),
        });
        setLoading(false);
        return;
      }

      try {
        const qs = new URLSearchParams({
          compare: "1",
          univ_a: String(parsed.univAId),
          univ_b: String(parsed.univBId),
          locale,
        });
        const res = await fetch(`/api/cross-comparisons?${qs.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (!cancelled) {
          setData((json.data as CrossComparePayload) ?? null);
        }
      } catch (e) {
        console.error("[crossadmit detail]", e);
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (comparisonId) void load();
    else setLoading(false);

    return () => {
      cancelled = true;
    };
  }, [comparisonId, locale]);

  const backHref = withLang("/crossadmit", locale);
  const backLabel = locale === "en" ? "← Back to CrossAdmit" : "← 크로스어드밋으로";

  return (
    <main className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A]">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link
          href={backHref}
          className="text-sm text-[#2D5A27] hover:underline mb-6 inline-block"
        >
          {backLabel}
        </Link>

        {legacyLabels && !loading && (
          <div className="rounded-xl border border-[#E5E5E0] bg-white p-8 text-center space-y-3">
            <p className="text-lg font-bold">
              {legacyLabels.a} vs {legacyLabels.b}
            </p>
            <p className="text-sm text-[#6B7280]">
              {locale === "en"
                ? "School not in database"
                : "등록되지 않은 학교"}
            </p>
            <p className="text-xs text-[#9CA3AF]">
              {formatSchoolKeyLabel(comparisonId.split("-vs-")[0] ?? "", locale)}
              {" · "}
              {formatSchoolKeyLabel(comparisonId.split("-vs-")[1] ?? "", locale)}
            </p>
          </div>
        )}

        {!legacyLabels && (
          <CrossadmitComparisonResult
            data={data}
            loading={loading}
            locale={locale}
          />
        )}

        {!loading && !legacyLabels && !data && (
          <div className="rounded-xl border border-[#E5E5E0] bg-white p-8 text-center mt-4">
            <p className="font-medium">
              {locale === "en"
                ? "Comparison not found"
                : "비교를 찾을 수 없습니다"}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CrossAdmitDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
          <p className="text-[#6B7280]">Loading…</p>
        </main>
      }
    >
      <CrossAdmitDetailInner />
    </Suspense>
  );
}
