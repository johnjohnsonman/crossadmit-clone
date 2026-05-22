import { loadVerifiedIntlUniversities } from "@/lib/universities/intl-targets";
import { extractVisibleText, fetchHtml, loadHtml, slugId } from "./fetch-html";
import { processAndSaveItems, type RawStudyKoreaItem } from "./process-items";
import { normalizeUniversitySlug } from "./university-map";
import { clearUniversityCache } from "./university-id";

const FETCH_TIMEOUT_MS = 10_000;

const ADMISSION_HINT =
  /TOPIK|GPA|application|admission|document|deadline|requirement|international|foreign|English|visa|scholarship|degree|undergraduate|graduate/i;

function parseUniversityPage(
  html: string,
  meta: { id: number; name_kr: string; name_en: string; url: string }
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
  const displayName = meta.name_en || meta.name_kr;
  const slug =
    normalizeUniversitySlug("", `${meta.name_kr} ${meta.name_en}`) ||
    `univ_${meta.id}`;

  return {
    source_id: slugId(`intl-${meta.id}-${meta.url}`),
    title: `${displayName} — International Admission Information`,
    content,
    url: meta.url,
    author: displayName,
    category: "admission",
    university: slug,
    university_id: meta.id,
    language: "en",
  };
}

export async function scrapeUniversitiesIntl() {
  const targets = await loadVerifiedIntlUniversities();
  const items: RawStudyKoreaItem[] = [];

  console.log(
    `[university_official] ${targets.length} universities with verified intl_url`
  );

  if (targets.length === 0) {
    return processAndSaveItems(
      "university_official",
      "university_official",
      [],
      "no verified intl_url rows"
    );
  }

  for (const univ of targets) {
    try {
      const html = await fetchHtml(univ.intl_url, FETCH_TIMEOUT_MS);
      const item = parseUniversityPage(html, {
        id: univ.id,
        name_kr: univ.name_kr,
        name_en: univ.name_en,
        url: univ.intl_url,
      });
      if (item) {
        items.push(item);
        console.log(
          `[university_official] ${univ.name_kr} OK (${item.content.length} chars)`
        );
      } else {
        console.warn(`[university_official] ${univ.name_kr} — insufficient content`);
      }
    } catch (e) {
      console.warn(
        `[university_official] skip ${univ.name_kr}:`,
        e instanceof Error ? e.message : e
      );
    }
  }

  clearUniversityCache();

  console.log(
    `[university_official] collected ${items.length}/${targets.length}`
  );

  return processAndSaveItems(
    "university_official",
    "university_official",
    items,
    targets.map((u) => u.name_kr).join(", ")
  );
}
