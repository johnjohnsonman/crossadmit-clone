/** 합격DB degree_level — 학위 단계 (학부/석박사/MBA/로스쿨) */

export const DEGREE_LEVEL_VALUES = [
  "undergraduate",
  "graduate",
  "mba",
  "law",
  "unknown",
] as const;

export type DegreeLevel = (typeof DEGREE_LEVEL_VALUES)[number];

export function isDegreeLevel(v: string): v is DegreeLevel {
  return (DEGREE_LEVEL_VALUES as readonly string[]).includes(v);
}
