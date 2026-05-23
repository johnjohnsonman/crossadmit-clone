import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5-20251001";

export type ExtractedAdmissionSchool = {
  univ_id: number | null;
  univ_name: string;
  dept_name: string;
  is_accept: boolean;
  is_regist: boolean;
};

export type ExtractedAdmission = {
  year: number;
  admission_type: string;
  schools: ExtractedAdmissionSchool[];
  nickname: string;
  review: string;
  exam_score: string | null;
  gpa: string | null;
  test_scores: string | null;
  extra_activities: string | null;
  confidence: "high" | "medium" | "low" | "skip";
};

type UnivRow = { id: number; name_kr: string; name_en: string | null };

const SYSTEM_PROMPT = `Extract Korean university admission information from this post.

CRITICAL RULES:
1. ONLY extract Korean universities (서울대/연세대/고려대/KAIST/POSTECH/성균관대/한양대 등)
2. If post is about FOREIGN universities only (MIT/Harvard/Stanford 등), return confidence: "skip"
3. Extract SPECIFIC numbers when present:
   - exam_score: 수능 점수, 백분위, 표준점수 (예: "국96 수98 영1 탐95")
   - gpa: 내신 등급 또는 GPA (예: "1.5등급", "GPA 4.0")
   - test_scores: SAT/IELTS/TOEFL/TOPIK 점수 (예: "TOPIK 5급, IELTS 7.0")
   - extra_activities: 비교과, 활동 내역 (예: "수학경시 1등, 영재원")
4. confidence:
   - "high": 학교/학과/전형/점수 모두 명확
   - "medium": 일부 정보 명확
   - "low": 정보 부족, 본문이 너무 짧음
   - "skip": 외국 대학만 다루거나 합격 후기가 아님

Return JSON only:
{
  "year": <number>,
  "admission_type": "<수시|정시|편입|MBA|로스쿨|대학원|GKS|기타>",
  "schools": [{"univ_id": <id or null>, "univ_name": "<string>", "dept_name": "<string>", "is_accept": <bool>, "is_regist": <bool>}],
  "nickname": "<string>",
  "review": "<full review text in Korean>",
  "exam_score": "<string or null>",
  "gpa": "<string or null>",
  "test_scores": "<string or null>",
  "extra_activities": "<string or null>",
  "confidence": "high|medium|low|skip"
}

EXAMPLES of GOOD extraction:
Input: "2024 정시 서울대 의대 합격! 수능: 국 1등급 100점, 수학 1등급 100점, 영어 1등급, 탐구 1+1. 내신은 1.2등급. 의과학경진대회 금상."
Output: {
  "year": 2024,
  "admission_type": "정시",
  "schools": [{"univ_id": null, "univ_name": "서울대학교", "dept_name": "의과대학 의예과", "is_accept": true, "is_regist": true}],
  "nickname": "익명",
  "review": "2024 정시 서울대 의대 합격! 수능: 국 1등급 100점, 수학 1등급 100점, 영어 1등급, 탐구 1+1. 내신은 1.2등급. 의과학경진대회 금상.",
  "exam_score": "국1(100) 수1(100) 영1 탐1+1",
  "gpa": "1.2등급",
  "test_scores": null,
  "extra_activities": "의과학경진대회 금상",
  "confidence": "high"
}`;

function buildInputSpecialty(
  test_scores: string | null | undefined,
  extra_activities: string | null | undefined
): string {
  const parts: string[] = [];
  const test = String(test_scores ?? "").trim();
  const extra = String(extra_activities ?? "").trim();
  if (test) parts.push(test);
  if (extra) parts.push(extra);
  return parts.join("\n");
}

export function mapExtractedToAdmissionFields(extracted: ExtractedAdmission): {
  input_score: string;
  input_gpa: string;
  input_specialty: string;
} {
  return {
    input_score: String(extracted.exam_score ?? "").trim(),
    input_gpa: String(extracted.gpa ?? "").trim(),
    input_specialty: buildInputSpecialty(
      extracted.test_scores,
      extracted.extra_activities
    ),
  };
}

export async function extractAdmissionFromPost(
  title: string,
  content: string,
  universities: UnivRow[]
): Promise<ExtractedAdmission> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const anthropic = new Anthropic({ apiKey });
  const univList = universities
    .map((u) => `${u.id}: ${u.name_kr}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Post title: ${title}
Post content: ${content}

Available universities (id: name_kr):
${univList}`,
      },
    ],
  });

  const block = response.content[0];
  const text = block.type === "text" ? block.text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI 파싱 실패");
  }

  const parsed = JSON.parse(jsonMatch[0]) as ExtractedAdmission;
  if (!Array.isArray(parsed.schools) || parsed.schools.length === 0) {
    parsed.confidence = "low";
  }

  let registSeen = false;
  parsed.schools = parsed.schools.map((s) => {
    let is_regist = Boolean(s.is_regist);
    if (is_regist) {
      if (registSeen) is_regist = false;
      else registSeen = true;
    }
    return {
      univ_id:
        typeof s.univ_id === "number" && s.univ_id > 0 ? s.univ_id : null,
      univ_name: String(s.univ_name ?? "").trim() || "미상",
      dept_name: String(s.dept_name ?? "").trim() || "미상",
      is_accept: Boolean(s.is_accept),
      is_regist,
    };
  });

  return parsed;
}
