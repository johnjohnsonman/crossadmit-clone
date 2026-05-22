import * as cheerio from "cheerio";

export const BROWSER_HEADERS: HeadersInit = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,ko;q=0.8",
};

export async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: BROWSER_HEADERS,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.text();
}

export function loadHtml(html: string) {
  return cheerio.load(html);
}

export function extractVisibleText($: cheerio.CheerioAPI, selector: string): string {
  const parts: string[] = [];
  $(selector).each((_, el) => {
    const t = $(el).text().replace(/\s+/g, " ").trim();
    if (t.length > 20) parts.push(t);
  });
  return parts.join("\n\n").slice(0, 12000);
}

export function slugId(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36) + input.length.toString(36);
}
