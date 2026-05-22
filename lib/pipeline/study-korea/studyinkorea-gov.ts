import type { ScrapeRunResult } from "./types";

/** studyinkorea.go.kr — 서버 HTML 파싱 불가, 파이프라인 비활성화 */
export async function scrapeStudyInKoreaGov(): Promise<ScrapeRunResult> {
  console.log("[studyinkorea-gov] disabled — HTML structure not parseable");
  return {
    collected: 0,
    processed: 0,
    saved: 0,
    failed: 0,
    skipped: 0,
    errors: ["Source disabled: studyinkorea.go.kr HTML parsing unavailable"],
  };
}
