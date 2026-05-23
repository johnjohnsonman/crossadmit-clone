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
  confidence: "high" | "medium" | "low";
};

type UnivRow = { id: number; name_kr: string; name_en: string | null };

const SYSTEM_PROMPT = `Extract Korean university admission information from this post.

Return JSON with this exact structure:
{
  "year": <number, admission year (입학 연도, not the year of writing)>,
  "admission_type": <"수시" | "정시" | "편입" | "MBA" | "로스쿨" | "대학원" | "기타">,
  "schools": [
    {
      "univ_id": <number from list, or null if not in list>,
      "univ_name": "<actual school name>",
      "dept_name": "<department name>",
      "is_accept": <boolean, did they get accepted>,
      "is_regist": <boolean, did they enroll/register here>
    }
  ],
  "nickname": "<author nickname or '익명'>",
  "review": "<full review text in Korean, summarized if needed>",
  "confidence": "high" | "medium" | "low"
}

Rules:
- Multiple schools allowed
- is_regist=true for ONE school only (where they enrolled)
- If unclear or no admission info, return confidence: "low"
- Be conservative; only extract what's clearly stated`;

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
    max_tokens: 2000,
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
