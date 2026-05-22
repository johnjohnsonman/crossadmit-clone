import { NextRequest, NextResponse } from "next/server";
import { verifyCronOrAdmin } from "@/lib/pipeline/study-korea/auth";
import { isNaverConfigured, scrapeNaverStudyKorea } from "@/lib/pipeline/study-korea/naver";
import { scrapeQuoraStudyKorea } from "@/lib/pipeline/study-korea/quora";
import { scrapeRedditStudyKorea } from "@/lib/pipeline/study-korea/reddit";
import { scrapeStudyInKoreaGov } from "@/lib/pipeline/study-korea/studyinkorea-gov";
import { scrapeUniversitiesIntl } from "@/lib/pipeline/study-korea/universities-intl";
import { scrapeYoutubeStudyKorea } from "@/lib/pipeline/study-korea/youtube";
import type { ScrapeRunResult } from "@/lib/pipeline/study-korea/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

async function safeRun(
  name: string,
  fn: () => Promise<ScrapeRunResult>
): Promise<ScrapeRunResult> {
  try {
    return await fn();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[master] ${name} failed:`, msg);
    return {
      collected: 0,
      processed: 0,
      saved: 0,
      failed: 1,
      skipped: 0,
      errors: [msg],
    };
  }
}

export async function GET(request: NextRequest) {
  if (!verifyCronOrAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[master] scrape-study-korea started");

  const youtube = await safeRun("youtube", scrapeYoutubeStudyKorea);
  const reddit = await safeRun("reddit", scrapeRedditStudyKorea);
  const quora = await safeRun("quora", scrapeQuoraStudyKorea);
  const studyinkorea = await safeRun("studyinkorea", scrapeStudyInKoreaGov);
  const university_official = await safeRun(
    "university_official",
    scrapeUniversitiesIntl
  );

  let naver_blog: ScrapeRunResult = {
    collected: 0,
    processed: 0,
    saved: 0,
    failed: 0,
    skipped: 0,
    errors: ["skipped — NAVER keys not set"],
  };
  if (isNaverConfigured()) {
    naver_blog = await safeRun("naver_blog", scrapeNaverStudyKorea);
  }

  const totalSaved =
    youtube.saved +
    reddit.saved +
    quora.saved +
    studyinkorea.saved +
    university_official.saved +
    naver_blog.saved;

  console.log("[master] total saved:", totalSaved);

  return NextResponse.json({
    success: true,
    totalSaved,
    youtube,
    reddit,
    quora,
    studyinkorea,
    university_official,
    naver_blog,
    timestamp: new Date().toISOString(),
  });
}
