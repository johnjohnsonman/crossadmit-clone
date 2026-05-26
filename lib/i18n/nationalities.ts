export interface Nationality {
  code: string;
  name_en: string;
  name_ko: string;
  flag: string;
  region: string;
}

export const COMMON_NATIONALITIES: Nationality[] = [
  { code: "VN", name_en: "Vietnam", name_ko: "베트남", flag: "🇻🇳", region: "southeast_asia" },
  { code: "CN", name_en: "China", name_ko: "중국", flag: "🇨🇳", region: "east_asia" },
  { code: "UZ", name_en: "Uzbekistan", name_ko: "우즈베키스탄", flag: "🇺🇿", region: "central_asia" },
  { code: "MN", name_en: "Mongolia", name_ko: "몽골", flag: "🇲🇳", region: "east_asia" },
  { code: "NP", name_en: "Nepal", name_ko: "네팔", flag: "🇳🇵", region: "south_asia" },
  { code: "IN", name_en: "India", name_ko: "인도", flag: "🇮🇳", region: "south_asia" },
  { code: "TH", name_en: "Thailand", name_ko: "태국", flag: "🇹🇭", region: "southeast_asia" },
  { code: "ID", name_en: "Indonesia", name_ko: "인도네시아", flag: "🇮🇩", region: "southeast_asia" },
  { code: "PH", name_en: "Philippines", name_ko: "필리핀", flag: "🇵🇭", region: "southeast_asia" },
  { code: "MY", name_en: "Malaysia", name_ko: "말레이시아", flag: "🇲🇾", region: "southeast_asia" },
  { code: "JP", name_en: "Japan", name_ko: "일본", flag: "🇯🇵", region: "east_asia" },
  { code: "US", name_en: "United States", name_ko: "미국", flag: "🇺🇸", region: "north_america" },
  { code: "GB", name_en: "United Kingdom", name_ko: "영국", flag: "🇬🇧", region: "europe" },
  { code: "CA", name_en: "Canada", name_ko: "캐나다", flag: "🇨🇦", region: "north_america" },
  { code: "AU", name_en: "Australia", name_ko: "호주", flag: "🇦🇺", region: "oceania" },
  { code: "DE", name_en: "Germany", name_ko: "독일", flag: "🇩🇪", region: "europe" },
  { code: "FR", name_en: "France", name_ko: "프랑스", flag: "🇫🇷", region: "europe" },
  { code: "RU", name_en: "Russia", name_ko: "러시아", flag: "🇷🇺", region: "europe" },
  { code: "KZ", name_en: "Kazakhstan", name_ko: "카자흐스탄", flag: "🇰🇿", region: "central_asia" },
  { code: "KG", name_en: "Kyrgyzstan", name_ko: "키르기스스탄", flag: "🇰🇬", region: "central_asia" },
  { code: "PK", name_en: "Pakistan", name_ko: "파키스탄", flag: "🇵🇰", region: "south_asia" },
  { code: "BD", name_en: "Bangladesh", name_ko: "방글라데시", flag: "🇧🇩", region: "south_asia" },
  { code: "LK", name_en: "Sri Lanka", name_ko: "스리랑카", flag: "🇱🇰", region: "south_asia" },
  { code: "MM", name_en: "Myanmar", name_ko: "미얀마", flag: "🇲🇲", region: "southeast_asia" },
  { code: "KH", name_en: "Cambodia", name_ko: "캄보디아", flag: "🇰🇭", region: "southeast_asia" },
  { code: "LA", name_en: "Laos", name_ko: "라오스", flag: "🇱🇦", region: "southeast_asia" },
  { code: "TR", name_en: "Türkiye", name_ko: "튀르키예", flag: "🇹🇷", region: "europe" },
  { code: "EG", name_en: "Egypt", name_ko: "이집트", flag: "🇪🇬", region: "africa" },
  { code: "NG", name_en: "Nigeria", name_ko: "나이지리아", flag: "🇳🇬", region: "africa" },
  { code: "BR", name_en: "Brazil", name_ko: "브라질", flag: "🇧🇷", region: "south_america" },
  { code: "MX", name_en: "Mexico", name_ko: "멕시코", flag: "🇲🇽", region: "north_america" },
  { code: "OTHER", name_en: "Other", name_ko: "기타", flag: "🌐", region: "other" },
  { code: "PREFER_NOT", name_en: "Prefer not to say", name_ko: "밝히지 않음", flag: "—", region: "other" },
];

export const REGIONS = {
  southeast_asia: { name_en: "Southeast Asia", name_ko: "동남아시아" },
  east_asia: { name_en: "East Asia", name_ko: "동아시아" },
  central_asia: { name_en: "Central Asia", name_ko: "중앙아시아" },
  south_asia: { name_en: "South Asia", name_ko: "남아시아" },
  europe: { name_en: "Europe", name_ko: "유럽" },
  north_america: { name_en: "North America", name_ko: "북미" },
  south_america: { name_en: "South America", name_ko: "남미" },
  oceania: { name_en: "Oceania", name_ko: "오세아니아" },
  africa: { name_en: "Africa", name_ko: "아프리카" },
  other: { name_en: "Other", name_ko: "기타" },
} as const;

export type RegionKey = keyof typeof REGIONS;
export type AdmissionGender = "male" | "female" | "other" | "prefer_not_to_say";

export const GENDER_OPTIONS: Array<{
  value: AdmissionGender;
  name_en: string;
  name_ko: string;
}> = [
  { value: "male", name_en: "Male", name_ko: "남성" },
  { value: "female", name_en: "Female", name_ko: "여성" },
  { value: "other", name_en: "Other", name_ko: "기타" },
  {
    value: "prefer_not_to_say",
    name_en: "Prefer not to say",
    name_ko: "밝히지 않음",
  },
];

export const NATIONALITY_BY_CODE = new Map(
  COMMON_NATIONALITIES.map((item) => [item.code, item] as const)
);

export const FILTERABLE_NATIONALITIES = COMMON_NATIONALITIES.filter(
  (item) => item.code !== "PREFER_NOT"
);

export function getNationality(code?: string | null): Nationality | undefined {
  if (!code) return undefined;
  return NATIONALITY_BY_CODE.get(code.trim().toUpperCase());
}

export function getNationalityLabel(
  code: string | null | undefined,
  locale: "ko" | "en" = "ko"
): string | undefined {
  const nationality = getNationality(code);
  if (!nationality) return undefined;
  return locale === "en" ? nationality.name_en : nationality.name_ko;
}

export function getNationalityFlag(code?: string | null): string | undefined {
  return getNationality(code)?.flag;
}

export function getNationalityRegion(
  code?: string | null
): RegionKey | undefined {
  const region = getNationality(code)?.region;
  if (!region) return undefined;
  return region in REGIONS ? (region as RegionKey) : undefined;
}

export function getRegionLabel(
  region: string | null | undefined,
  locale: "ko" | "en" = "ko"
): string | undefined {
  if (!region || !(region in REGIONS)) return undefined;
  return locale === "en"
    ? REGIONS[region as RegionKey].name_en
    : REGIONS[region as RegionKey].name_ko;
}

export function getGenderLabel(
  gender: string | null | undefined,
  locale: "ko" | "en" = "ko"
): string | undefined {
  const found = GENDER_OPTIONS.find((item) => item.value === gender);
  if (!found) return undefined;
  return locale === "en" ? found.name_en : found.name_ko;
}
