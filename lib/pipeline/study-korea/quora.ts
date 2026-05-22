import { extractVisibleText, fetchHtml, loadHtml, slugId } from "./fetch-html";
import { processAndSaveItems, type RawStudyKoreaItem } from "./process-items";

const QUORA_URLS = [
  "https://www.quora.com/search?q=studying+in+Korea+university",
  "https://www.quora.com/search?q=Korean+university+admission+international",
  "https://www.quora.com/search?q=GKS+scholarship+Korea",
];

function parseQuoraSearch(html: string, pageUrl: string): RawStudyKoreaItem[] {
  const $ = loadHtml(html);
  const items: RawStudyKoreaItem[] = [];
  const seen = new Set<string>();

  const qTexts: string[] = [];
  $(".q-text, [class*='q-text']").each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (t.length > 15) qTexts.push(t);
  });

  if (qTexts.length === 0) {
    $("a[href*='/']").each((_, el) => {
      const href = $(el).attr("href") ?? "";
      if (!href.includes("quora.com") || href.includes("/search")) return;
      const t = $(el).text().replace(/\s+/g, " ").trim();
      if (t.length < 20 || t.length > 300) return;
      const url = href.startsWith("http") ? href : `https://www.quora.com${href}`;
      const id = slugId(url);
      if (seen.has(id)) return;
      seen.add(id);
      items.push({
        source_id: id,
        title: t.slice(0, 200),
        content: t,
        url,
        author: "quora",
      });
    });
    return items.slice(0, 15);
  }

  for (let i = 0; i < qTexts.length; i += 2) {
    const title = qTexts[i] ?? "";
    const answer = qTexts[i + 1] ?? "";
    const combined = [title, answer].filter(Boolean).join("\n\n");
    const id = slugId(`${pageUrl}-${title}`);
    if (seen.has(id) || title.length < 10) continue;
    seen.add(id);
    items.push({
      source_id: id,
      title: title.slice(0, 200),
      content: combined.slice(0, 4000),
      url: pageUrl,
      author: "quora",
    });
  }

  return items.slice(0, 20);
}

export async function scrapeQuoraStudyKorea() {
  const all: RawStudyKoreaItem[] = [];
  const seen = new Set<string>();

  for (const url of QUORA_URLS) {
    try {
      const html = await fetchHtml(url);
      const items = parseQuoraSearch(html, url);
      for (const item of items) {
        if (seen.has(item.source_id)) continue;
        seen.add(item.source_id);
        all.push(item);
      }
      console.log(`[quora] ${url} → ${items.length} items`);
    } catch (e) {
      console.warn(`[quora] skip ${url}:`, e instanceof Error ? e.message : e);
    }
  }

  return processAndSaveItems("quora", "quora", all, QUORA_URLS.join(" | "));
}
