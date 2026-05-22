import { extractVisibleText, fetchHtml, loadHtml, slugId } from "./fetch-html";
import { processAndSaveItems, type RawStudyKoreaItem } from "./process-items";

const UNIV_SLUG: Record<string, string> = {
  SNU: "snu",
  Yonsei: "yonsei",
  "Korea Univ": "korea_univ",
  KAIST: "kaist",
  Sungkyunkwan: "skku",
  Hanyang: "hanyang",
  POSTECH: "postech",
};

const UNIVERSITY_PAGES = [
  { name: "SNU", url: "https://en.snu.ac.kr/apply/info" },
  {
    name: "Yonsei",
    url: "https://www.yonsei.ac.kr/en_sc/admission/ug_foreign.jsp",
  },
  {
    name: "Korea Univ",
    url: "https://oia.korea.ac.kr/english/programs/inbound",
  },
  { name: "KAIST", url: "https://admission.kaist.ac.kr/intl-graduate/" },
  {
    name: "Sungkyunkwan",
    url: "https://www.skku.edu/eng/Admission/Graduate/foreign.do",
  },
  {
    name: "Hanyang",
    url: "https://www.hanyang.ac.kr/web/eng/international_student",
  },
  { name: "POSTECH", url: "https://admission.postech.ac.kr/international/" },
];

function parseUniversityPage(
  html: string,
  meta: { name: string; url: string }
): RawStudyKoreaItem | null {
  const $ = loadHtml(html);
  const main =
    extractVisibleText(
      $,
      "main p, article p, .content p, #content, .board_view, .detail"
    ) || $("body").text().replace(/\s+/g, " ").trim();

  const admissionHints = /TOPIK|GPA|application|admission|document|deadline|requirement|international|foreign|English/i;
  if (!admissionHints.test(main) && main.length < 200) {
    return null;
  }

  const content = main.slice(0, 8000);
  const slug = UNIV_SLUG[meta.name] ?? meta.name.toLowerCase().replace(/\s+/g, "_");

  return {
    source_id: slugId(`${meta.name}-${meta.url}`),
    title: `${meta.name} — International Admission Requirements`,
    content,
    url: meta.url,
    author: meta.name,
    category: "admission",
    university: slug,
    language: "en",
  };
}

export async function scrapeUniversitiesIntl() {
  const items: RawStudyKoreaItem[] = [];

  for (const page of UNIVERSITY_PAGES) {
    try {
      const html = await fetchHtml(page.url);
      const item = parseUniversityPage(html, page);
      if (item) items.push(item);
      console.log(`[university_official] ${page.name} ok=${!!item}`);
    } catch (e) {
      console.warn(
        `[university_official] skip ${page.name}:`,
        e instanceof Error ? e.message : e
      );
    }
  }

  return processAndSaveItems(
    "university_official",
    "university_official",
    items,
    UNIVERSITY_PAGES.map((p) => p.name).join(", ")
  );
}
