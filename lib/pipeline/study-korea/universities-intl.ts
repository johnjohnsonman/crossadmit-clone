import { extractVisibleText, fetchHtml, loadHtml, slugId } from "./fetch-html";
import { processAndSaveItems, type RawStudyKoreaItem } from "./process-items";

const FETCH_TIMEOUT_MS = 10_000;

const UNIV_SLUG: Record<string, string> = {
  SNU: "snu",
  KAIST: "kaist",
  Yonsei: "yonsei",
  "Korea Univ": "korea_univ",
  POSTECH: "postech",
  Sungkyunkwan: "skku",
  Hanyang: "hanyang",
  Sogang: "sogang",
  Ewha: "ewha",
  UNIST: "unist",
  DGIST: "dgist",
};

const UNIVERSITY_PAGES = [
  { name: "SNU", url: "https://en.snu.ac.kr/apply/info" },
  { name: "KAIST", url: "https://admission.kaist.ac.kr/intl-graduate/" },
  {
    name: "Yonsei",
    url: "https://admission.yonsei.ac.kr/international/en/html/intro/intro_00.asp",
  },
  {
    name: "Korea Univ",
    url: "https://oia.korea.ac.kr/english/programs/inbound",
  },
  { name: "POSTECH", url: "https://admission.postech.ac.kr/international/" },
  {
    name: "Sungkyunkwan",
    url: "https://www.skku.edu/eng/Admission/index.do",
  },
  {
    name: "Hanyang",
    url: "https://www.hanyang.ac.kr/web/eng/international_student",
  },
  {
    name: "Sogang",
    url: "https://iie.sogang.ac.kr/iie/en/01_intro/intro.html",
  },
  { name: "Ewha", url: "https://ibsi.ewha.ac.kr/eng/admissions/index.html" },
  { name: "UNIST", url: "https://www.unist.ac.kr/admission/international/" },
  { name: "DGIST", url: "https://www.dgist.ac.kr/en/html/sub07/070101.html" },
];

const ADMISSION_HINT =
  /TOPIK|GPA|application|admission|document|deadline|requirement|international|foreign|English|visa|scholarship|degree|undergraduate|graduate/i;

function parseUniversityPage(
  html: string,
  meta: { name: string; url: string }
): RawStudyKoreaItem | null {
  const $ = loadHtml(html);

  const blocks = [
    extractVisibleText(
      $,
      "main p, main li, article p, article li, .content p, #content p, .board_view, .detail, .txt, .text"
    ),
    extractVisibleText($, "h1, h2, h3, .title"),
    $("body")
      .text()
      .replace(/\s+/g, " ")
      .trim(),
  ].filter(Boolean);

  const main = blocks.join("\n\n").slice(0, 12000);

  if (main.length < 120) return null;
  if (!ADMISSION_HINT.test(main) && main.length < 400) return null;

  const content = main.slice(0, 8000);
  const slug =
    UNIV_SLUG[meta.name] ?? meta.name.toLowerCase().replace(/\s+/g, "_");

  return {
    source_id: slugId(`${meta.name}-${meta.url}`),
    title: `${meta.name} — International Admission Information`,
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
      const html = await fetchHtml(page.url, FETCH_TIMEOUT_MS);
      const item = parseUniversityPage(html, page);
      if (item) {
        items.push(item);
        console.log(`[university_official] ${page.name} OK (${item.content.length} chars)`);
      } else {
        console.warn(`[university_official] ${page.name} — insufficient content`);
      }
    } catch (e) {
      console.warn(
        `[university_official] skip ${page.name}:`,
        e instanceof Error ? e.message : e
      );
    }
  }

  console.log(
    `[university_official] collected ${items.length}/${UNIVERSITY_PAGES.length}`
  );

  return processAndSaveItems(
    "university_official",
    "university_official",
    items,
    UNIVERSITY_PAGES.map((p) => p.name).join(", ")
  );
}
