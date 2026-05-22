import { extractVisibleText, fetchHtml, loadHtml, slugId } from "./fetch-html";
import { processAndSaveItems, type RawStudyKoreaItem } from "./process-items";

const GOV_PAGES = [
  {
    title: "GKS Scholarship (Global Korea Scholarship)",
    url: "https://www.studyinkorea.go.kr/en/sub/gks/allnew_gks.do",
  },
  {
    title: "University List - Study in Korea",
    url: "https://www.studyinkorea.go.kr/en/sub/info/university_list.do",
  },
];

function parseGovPage(html: string, meta: { title: string; url: string }): RawStudyKoreaItem | null {
  const $ = loadHtml(html);
  const bodyText =
    extractVisibleText($, "article p, .content p, #content p, .board_list, table td, li") ||
    $("body").text().replace(/\s+/g, " ").trim();

  const notices = extractVisibleText($, ".notice, .board, .list, h2, h3");
  const content = [notices, bodyText].filter(Boolean).join("\n\n").slice(0, 8000);

  if (content.length < 50) return null;

  return {
    source_id: slugId(meta.url),
    title: meta.title,
    content,
    url: meta.url,
    author: "studyinkorea.go.kr",
    category: "scholarship",
    language: "en",
    skipClaude: false,
  };
}

export async function scrapeStudyInKoreaGov() {
  const items: RawStudyKoreaItem[] = [];

  for (const page of GOV_PAGES) {
    try {
      const html = await fetchHtml(page.url);
      const item = parseGovPage(html, page);
      if (item) items.push(item);
      console.log(`[studyinkorea-gov] ${page.url} ok=${!!item}`);
    } catch (e) {
      console.warn(
        `[studyinkorea-gov] skip ${page.url}:`,
        e instanceof Error ? e.message : e
      );
    }
  }

  return processAndSaveItems(
    "studyinkorea",
    "studyinkorea",
    items,
    GOV_PAGES.map((p) => p.url).join(" | ")
  );
}
