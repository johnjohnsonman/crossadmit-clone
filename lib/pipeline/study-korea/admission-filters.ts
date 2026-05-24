/** 외국인 한국 유학 타겟 필터 — 한국인 수능/수시 입시 후기 제외 */

export const FOREIGN_KEYWORDS =
  /국제|international|foreign|외국인|GKS|TOPIK|D-2\s*visa|exchange|study in korea|studying in korea|留学|du học|admitted to|got into.*korea|accepted to|scholarship|유학|global korea|international student|foreign student|留学生|trúng tuyển/i;

export const KOREAN_DOMESTIC_KEYWORDS =
  /수능|수시|정시|학종|논술|진학사|칸수|내신\s*\d+\s*등급|시대인재|한석원|EBS\s*연계/i;

/**
 * Naver 스니펫 기준: 외국인 유학 관련 키워드 필수.
 * 한국인 입시 키워드만 있는 경우 제외 (외국인 키워드 동시 있으면 통과).
 */
export function passesInternationalAdmissionFilter(fullText: string): boolean {
  const text = fullText.trim();
  if (!text) return false;

  const hasForeign = FOREIGN_KEYWORDS.test(text);
  if (!hasForeign) return false;

  const hasDomestic = KOREAN_DOMESTIC_KEYWORDS.test(text);
  if (hasDomestic && !hasForeign) return false;

  return true;
}
