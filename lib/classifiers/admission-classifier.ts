import Anthropic from "@anthropic-ai/sdk";
import type { DegreeLevel } from "@/lib/admissions/degree-level";
import { isDegreeLevel } from "@/lib/admissions/degree-level";
import type { OriginalLanguage } from "@/lib/admissions/original-language";
import { normalizeOriginalLanguage } from "@/lib/admissions/original-language";
import { loadAllUniversities } from "@/lib/pipeline/study-korea/university-id";
import {
  cacheUrlClassifier,
  canCallClassifier,
  isUrlClassifierCached,
  recordClassifierCall,
} from "@/lib/classifiers/classifier-usage";

const MODEL = "claude-haiku-4-5-20251001";

const UNIV_ALIASES: Record<string, string[]> = {
  SNU: [
    "서울대",
    "서울대학교",
    "Seoul National University",
    "SNU",
    "Dai hoc Quoc gia Seoul",
    "Đại học Quốc gia Seoul",
    "首尔大学",
    "首尔国立大学",
  ],
  KU: [
    "고려대",
    "고려대학교",
    "Korea University",
    "KU",
    "Đại học Korea",
    "Dai hoc Korea",
    "高丽大学",
  ],
  Yonsei: [
    "연세대",
    "연세대학교",
    "Yonsei University",
    "Yonsei",
    "Đại học Yonsei",
    "Dai hoc Yonsei",
    "延世大学",
  ],
  KAIST: [
    "KAIST",
    "카이스트",
    "Korea Advanced Institute of Science",
    "Viện Khoa học và Công nghệ Tiên tiến Hàn Quốc",
    "韩国科学技术院",
  ],
  POSTECH: [
    "POSTECH",
    "포항공대",
    "Pohang University of Science",
    "Đại học Khoa học và Công nghệ Pohang",
    "浦项工科大学",
  ],
  SKKU: [
    "성균관대",
    "성균관대학교",
    "Sungkyunkwan University",
    "SKKU",
    "Đại học Sungkyunkwan",
    "成均馆大学",
  ],
  Hanyang: [
    "한양대",
    "한양대학교",
    "Hanyang University",
    "Đại học Hanyang",
    "汉阳大学",
  ],
  Sogang: ["서강대", "Sogang University"],
  Ewha: [
    "이화여대",
    "Ewha Womans University",
    "Ewha",
    "Đại học Nữ Ewha",
    "梨花女子大学",
  ],
  HUFS: ["외대", "한국외대", "Hankuk University of Foreign Studies"],
};

const ADMISSION_VERB =
  /\b(accepted|admitted|got into|enrolled|matriculated|acceptance|got in|made it|i'm in|i am in)\b/i;
const ADMISSION_VERB_KO = /(합격|입학|붙었|어드밋|어떻게 들어갔)/;
const ADMISSION_VERB_VI =
  /(trúng tuyển|đậu|duoc nhan|được nhận|được chấp nhận)/i;
const ADMISSION_VERB_ZH = /(录取|考上|申请成功|拿到offer|拿到 offer)/i;
const ADMISSION_VERB_JA = /(合格|受かった)/;
const REJECT_MAIN =
  /\b(rejected|denied|didn't get in|did not get in|got rejected|waitlisted only)\b/i;

export type ExtractedUniversity = {
  name: string;
  department: string | null;
  result: "admitted" | "enrolled" | "rejected" | "waitlisted";
};

export type ExtractedScores = {
  sat: string | null;
  act: string | null;
  ib: string | null;
  ap: string | null;
  a_level: string | null;
  topik: string | null;
  toefl: string | null;
  ielts: string | null;
  gpa: string | null;
  other: string | null;
};

export type ExtractedAdmissionData = {
  display_name: string | null;
  year_admitted: number | null;
  admit_track:
    | "international"
    | "overseas_kr"
    | "gks"
    | "regular_kr"
    | "abroad"
    | "unknown";
  degree_level: DegreeLevel;
  original_language: OriginalLanguage;
  home_country: string | null;
  high_school_type: string | null;
  universities: ExtractedUniversity[];
  scores: ExtractedScores;
  extracurriculars: string | null;
  essays: string | null;
  interview: string | null;
  tips: string | null;
};

export type Stage1Result = {
  pass: boolean;
  matchedUniversities: string[];
  reason: string;
};

export type ClassificationResult = {
  classification: "admission" | "general" | "review_needed";
  data: ExtractedAdmissionData | null;
  confidence: number;
  original_language: OriginalLanguage;
  track_evidence: string;
  reasoning: string;
};

let universitiesCache: Awaited<ReturnType<typeof loadAllUniversities>> | null =
  null;

async function getUniversities() {
  if (!universitiesCache) {
    universitiesCache = await loadAllUniversities();
  }
  return universitiesCache;
}

function firstParagraph(text: string): string {
  const parts = text.split(/\n\n+/);
  return (parts[0] ?? text).slice(0, 800);
}

export async function runStage1Filter(
  title: string,
  body: string
): Promise<Stage1Result> {
  const text = `${title}\n${body}`;
  const unis = await getUniversities();
  const matched: string[] = [];

  for (const u of unis) {
    const names = [u.name_kr, u.name_en].filter(Boolean);
    for (const n of names) {
      if (n.length >= 2 && text.includes(n)) {
        matched.push(u.name_en || u.name_kr);
        break;
      }
    }
  }

  for (const aliases of Object.values(UNIV_ALIASES)) {
    for (const alias of aliases) {
      if (text.toLowerCase().includes(alias.toLowerCase())) {
        matched.push(alias);
      }
    }
  }

  const unique = [...new Set(matched)];
  const hasAdmissionVerb =
    ADMISSION_VERB.test(text) ||
    ADMISSION_VERB_KO.test(text) ||
    ADMISSION_VERB_VI.test(text) ||
    ADMISSION_VERB_ZH.test(text) ||
    ADMISSION_VERB_JA.test(text);
  const rejectInLead = REJECT_MAIN.test(firstParagraph(text));

  if (unique.length === 0) {
    console.log(`[stage1] failed (no_university): ${title.slice(0, 80)}`);
    return { pass: false, matchedUniversities: [], reason: "no_university" };
  }
  if (!hasAdmissionVerb) {
    console.log(`[stage1] failed (no_admission_verb): ${title.slice(0, 80)}`);
    return {
      pass: false,
      matchedUniversities: unique,
      reason: "no_admission_verb",
    };
  }
  if (rejectInLead && !ADMISSION_VERB.test(firstParagraph(text))) {
    console.log(`[stage1] failed (rejection_focus): ${title.slice(0, 80)}`);
    return {
      pass: false,
      matchedUniversities: unique,
      reason: "rejection_focus",
    };
  }

  console.log(`[stage1] passed: ${title.slice(0, 80)}`);
  return { pass: true, matchedUniversities: unique, reason: "ok" };
}

type LlmPayload = {
  is_admission_story?: boolean;
  is_korean_university?: boolean;
  confidence?: number;
  original_language?: string;
  extracted?: Partial<ExtractedAdmissionData>;
  track_evidence?: string;
  reasoning?: string;
};

function buildClassifierPrompt(
  title: string,
  body: string,
  source: string,
  url: string
): string {
  return `You are extracting structured admission data from a social media post.
Output must match the schema below precisely. If a field is uncertain, use null.
The post may be in any language (English, Korean, Vietnamese, Chinese, etc).
Detect the language and set "original_language" field.
Output ALL extracted fields in English (translate if needed).

Post title: ${title}
Post body: ${body.slice(0, 3000)}
Source: ${source}
URL: ${url}

Return ONLY valid JSON (no markdown fence):
{
  "is_admission_story": boolean,
  "is_korean_university": boolean,
  "confidence": 0.0-1.0,
  "original_language": "en" | "ko" | "vi" | "zh" | "mn" | "uz" | "ne" | "my" | "ja" | "ru" | "es" | "ar" | "other",
  "extracted": {
    "display_name": string | null,
    "year_admitted": number | null,
    "admit_track": "international" | "overseas_kr" | "gks" | "regular_kr" | "abroad" | "unknown",
    "degree_level": "undergraduate" | "graduate" | "mba" | "law" | "unknown",
    "home_country": string | null,
    "high_school_type": "international" | "local_home_country" | "korean_overseas" | "online" | "other" | null,
    "universities": [
      {
        "name": string,
        "department": string | null,
        "result": "admitted" | "enrolled" | "rejected" | "waitlisted"
      }
    ],
    "scores": {
      "sat": string | null,
      "act": string | null,
      "ib": string | null,
      "ap": string | null,
      "a_level": string | null,
      "topik": string | null,
      "toefl": string | null,
      "ielts": string | null,
      "gpa": string | null,
      "other": string | null
    },
    "extracurriculars": string | null,
    "essays": string | null,
    "interview": string | null,
    "tips": string | null
  },
  "track_evidence": string,
  "reasoning": string
}

Rules:
- is_admission_story=true ONLY for personal share of own admission outcome.
- is_korean_university=true ONLY if admitted to a university physically in Korea.
- confidence < 0.7 means uncertain (review queue).
- If scores/fields not mentioned, use null. Don't fabricate.
- admit_track: who they are
  * international = non-Korean citizen at Korean university
  * overseas_kr = Korean citizen with overseas education
  * gks = Global Korea Scholarship recipient (any nationality)
  * regular_kr = Korean citizen regular admission
  * abroad = Korean citizen going to foreign university
- degree_level: what they applied for
  * undergraduate = Bachelor's program
  * graduate = Master's or PhD (not MBA, not Law)
  * mba = MBA program
  * law = Law school (Korean LEET system or J.D.)
- The two fields are independent. Example: international PhD = admit_track:international + degree_level:graduate
- GradCafe posts are almost always graduate (use undergraduate only if clearly a bachelor's result).
- For "extracurriculars", "essays", and "tips", provide concise English summaries, not raw untranslated text.`;
}

const ADMIT_TRACK_EXTRACTED = [
  "international",
  "overseas_kr",
  "gks",
  "regular_kr",
  "abroad",
  "unknown",
] as const;

type ExtractedAdmitTrack = (typeof ADMIT_TRACK_EXTRACTED)[number];

function coerceAdmitTrackAndDegree(
  rawTrack?: string,
  rawLevel?: string
): { admit_track: ExtractedAdmitTrack; degree_level: DegreeLevel } {
  let admit_track = (rawTrack ?? "unknown") as string;
  let degree_level: DegreeLevel =
    rawLevel && isDegreeLevel(rawLevel) ? rawLevel : "unknown";

  if (admit_track === "graduate") {
    admit_track = "regular_kr";
    if (degree_level === "unknown") degree_level = "graduate";
  }

  if (
    !(ADMIT_TRACK_EXTRACTED as readonly string[]).includes(admit_track)
  ) {
    admit_track = "unknown";
  }

  return {
    admit_track: admit_track as ExtractedAdmitTrack,
    degree_level,
  };
}

function normalizeExtracted(
  raw: Partial<ExtractedAdmissionData> | undefined,
  originalLanguage: string | null | undefined,
  fallbackText: string
): ExtractedAdmissionData {
  const scores = raw?.scores ?? {};
  const { admit_track, degree_level } = coerceAdmitTrackAndDegree(
    raw?.admit_track,
    raw?.degree_level
  );
  return {
    display_name: raw?.display_name ?? null,
    year_admitted: raw?.year_admitted ?? null,
    admit_track,
    degree_level,
    original_language: normalizeOriginalLanguage(originalLanguage, fallbackText),
    home_country: raw?.home_country ?? null,
    high_school_type: raw?.high_school_type ?? null,
    universities: Array.isArray(raw?.universities) ? raw!.universities! : [],
    scores: {
      sat: scores.sat ?? null,
      act: scores.act ?? null,
      ib: scores.ib ?? null,
      ap: scores.ap ?? null,
      a_level: scores.a_level ?? null,
      topik: scores.topik ?? null,
      toefl: scores.toefl ?? null,
      ielts: scores.ielts ?? null,
      gpa: scores.gpa ?? null,
      other: scores.other ?? null,
    },
    extracurriculars: raw?.extracurriculars ?? null,
    essays: raw?.essays ?? null,
    interview: raw?.interview ?? null,
    tips: raw?.tips ?? null,
  };
}

export async function runStage2Classifier(
  title: string,
  body: string,
  source: string,
  url: string
): Promise<ClassificationResult> {
  console.log(`[stage2] LLM call for: ${title.slice(0, 80)}`);

  if (isUrlClassifierCached(url)) {
    console.log(`[stage2] skipped (url_cached_24h): ${url}`);
    return {
      classification: "general",
      data: null,
      confidence: 0,
      original_language: "en",
      track_evidence: "",
      reasoning: "LLM skipped: url_cached_24h",
    };
  }

  const limit = await canCallClassifier();
  if (!limit.ok) {
    console.log(`[stage2] skipped (${limit.reason}): ${title.slice(0, 80)}`);
    return {
      classification: "general",
      data: null,
      confidence: 0,
      original_language: "en",
      track_evidence: "",
      reasoning: `LLM skipped: ${limit.reason}`,
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[stage2] ANTHROPIC_API_KEY missing");
    return {
      classification: "general",
      data: null,
      confidence: 0,
      original_language: "en",
      track_evidence: "",
      reasoning: "ANTHROPIC_API_KEY missing",
    };
  }

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: buildClassifierPrompt(title, body, source, url),
        },
      ],
    });

    await recordClassifierCall();
    cacheUrlClassifier(url);

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Classifier returned no text");
    }

    let parsed: LlmPayload;
    try {
      parsed = JSON.parse(textBlock.text) as LlmPayload;
    } catch {
      const m = textBlock.text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error("Classifier JSON parse failed");
      parsed = JSON.parse(m[0]) as LlmPayload;
    }

    const confidence = Math.min(1, Math.max(0, parsed.confidence ?? 0));
    const original_language = normalizeOriginalLanguage(
      parsed.original_language,
      `${title}\n${body}`
    );
    const data = normalizeExtracted(
      parsed.extracted,
      parsed.original_language,
      `${title}\n${body}`
    );
    const track_evidence = parsed.track_evidence ?? "";
    const reasoning = parsed.reasoning ?? "";

    const isStory = Boolean(parsed.is_admission_story);
    const isKr = Boolean(parsed.is_korean_university);

    let classification: ClassificationResult["classification"] = "general";
    if (isStory && isKr) {
      classification = confidence >= 0.7 ? "admission" : "review_needed";
    }

    console.log(
      `[stage2] result: ${classification} (confidence: ${confidence.toFixed(2)}) — ${title.slice(0, 60)}`
    );

    if (classification === "general") {
      return {
        classification: "general",
        data,
        confidence,
        original_language,
        track_evidence,
        reasoning,
      };
    }

    if (classification === "admission") {
      return {
        classification: "admission",
        data,
        confidence,
        original_language,
        track_evidence,
        reasoning,
      };
    }

    return {
      classification: "review_needed",
      data,
      confidence,
      original_language,
      track_evidence,
      reasoning,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[stage2] Anthropic API error:", msg, { url, title: title.slice(0, 80) });
    throw e;
  }
}

export async function classifyAdmissionPost(
  title: string,
  body: string,
  source: string,
  url: string
): Promise<ClassificationResult> {
  const stage1 = await runStage1Filter(title, body);
  if (!stage1.pass) {
    return {
      classification: "general",
      data: null,
      confidence: 0,
      original_language: "en",
      track_evidence: "",
      reasoning: `Stage1: ${stage1.reason}`,
    };
  }

  return runStage2Classifier(title, body, source, url);
}
