import { EMPTY_SCRAPE_RESULT } from "./types";

/** studyinkorea.go.kr — 서버 HTML 파싱 불가, 파이프라인 비활성화 */
export async function scrapeStudyInKoreaGov() {
  console.log("[studyinkorea-gov] disabled — HTML structure not parseable");
  return {
    ...EMPTY_SCRAPE_RESULT,
    errors: ["Source disabled: studyinkorea.go.kr HTML parsing unavailable"],
  };
}
