import { NextRequest, NextResponse } from "next/server";
import { verifyCronOrAdmin } from "@/lib/pipeline/study-korea/auth";
import { isNaverConfigured } from "@/lib/pipeline/study-korea/naver-api";
import { scrapeNaverNewsStudyKorea } from "@/lib/pipeline/study-korea/naver-news";
import { scrapeNaverStudyKorea } from "@/lib/pipeline/study-korea/naver";
import { scrapeUniversitiesIntl } from "@/lib/pipeline/study-korea/universities-intl";
import { scrapeYoutubeStudyKorea } from "@/lib/pipeline/study-korea/youtube";
import {
  EMPTY_SCRAPE_RESULT,
  type ScrapeRunResult,
} from "@/lib/pipeline/study-korea/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const SKIPPED: ScrapeRunResult = {
  ...EMPTY_SCRAPE_RESULT,
  errors: ["source disabled or unavailable"],
};

async function safeRun(
  name: string,
  fn: () => Promise<ScrapeRunResult>
): Promise<ScrapeRunResult> {
  try {
    return await fn();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[master] ${name} failed:`, msg);
    return { ...SKIPPED, failed: 1, errors: [msg] };
  }
}

export async function GET(request: NextRequest) {
  if (!verifyCronOrAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[master] scrape-study-korea started (active sources only)");

  const youtube = await safeRun("youtube", scrapeYoutubeStudyKorea);
  const university_official = await safeRun(
    "university_official",
    scrapeUniversitiesIntl
  );

  let naver_blog: ScrapeRunResult = { ...SKIPPED, errors: ["NAVER keys not set"] };
  let naver_news: ScrapeRunResult = { ...SKIPPED, errors: ["NAVER keys not set"] };
  if (isNaverConfigured()) {
    naver_blog = await safeRun("naver_blog", scrapeNaverStudyKorea);
    naver_news = await safeRun("naver_news", scrapeNaverNewsStudyKorea);
  }

  const totalSaved =
    youtube.saved +
    university_official.saved +
    naver_blog.saved +
    naver_news.saved;

  console.log("[master] total saved:", totalSaved);

  return NextResponse.json({
    success: true,
    totalSaved,
    skipped: ["reddit", "studyinkorea"],
    youtube,
    university_official,
    naver_blog,
    naver_news,
    timestamp: new Date().toISOString(),
  });
}
