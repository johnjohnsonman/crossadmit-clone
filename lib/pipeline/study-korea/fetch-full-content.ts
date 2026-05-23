import * as cheerio from "cheerio";
import { BROWSER_HEADERS } from "./fetch-html";

const BODY_SELECTORS = [
  ".se-main-container",
  ".post-view",
  "#postViewArea",
  ".write_div",
  ".gallview_contents",
  ".dc-board",
  "article",
  ".post-content",
  ".entry-content",
  ".view_content",
  "#post-body",
  "main",
] as const;

/** 원본 URL에서 본문 텍스트 추출 (네이버 블로그·디시·일반) */
export async function fetchFullContent(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(15_000),
      redirect: "follow",
    });
    if (!res.ok) return "";

    const html = await res.text();
    const $ = cheerio.load(html);

    $("script, style, nav, header, footer, .ads, .advertisement").remove();

    let bestText = "";
    for (const sel of BODY_SELECTORS) {
      const text = $(sel).text().trim().replace(/\s+/g, " ");
      if (text.length > bestText.length) {
        bestText = text;
      }
    }

    if (bestText.length < 200) {
      bestText = $("body").text().trim().replace(/\s+/g, " ");
    }

    return bestText.slice(0, 8000);
  } catch (e) {
    console.error("[FETCH_FULL]", url, e);
    return "";
  }
}
