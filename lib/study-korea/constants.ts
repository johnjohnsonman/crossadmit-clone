export const STUDY_KOREA_CATEGORIES = [
  "admission",
  "scholarship",
  "visa",
  "dormitory",
  "living_cost",
  "language",
  "campus_life",
  "settlement",
  "employment",
  "culture",
  "general",
  "life",
  "cost",
] as const;

export type StudyKoreaCategorySlug = (typeof STUDY_KOREA_CATEGORIES)[number];

export const CATEGORY_LABELS_KR: Record<string, string> = {
  all: "전체",
  admission: "입시",
  scholarship: "장학금",
  visa: "비자",
  dormitory: "기숙사",
  living_cost: "생활비",
  language: "어학",
  campus_life: "캠퍼스",
  settlement: "정착",
  employment: "취업",
  culture: "문화·생활",
  life: "생활",
  cost: "생활비",
  general: "일반",
};

export const CATEGORY_LABELS_EN: Record<string, string> = {
  all: "All",
  admission: "Admission",
  scholarship: "Scholarship",
  visa: "Visa",
  dormitory: "Dormitory",
  living_cost: "Living cost",
  language: "Language",
  campus_life: "Campus",
  settlement: "Settlement",
  employment: "Employment",
  culture: "Culture",
  life: "Life",
  cost: "Cost",
  general: "General",
};

export const UNIVERSITY_LABELS: Record<string, { kr: string; en: string }> = {
  snu: { kr: "서울대", en: "SNU" },
  yonsei: { kr: "연세대", en: "Yonsei" },
  korea_univ: { kr: "고려대", en: "Korea Univ." },
  kaist: { kr: "KAIST", en: "KAIST" },
  skku: { kr: "성균관대", en: "SKKU" },
  hanyang: { kr: "한양대", en: "Hanyang" },
  cau: { kr: "중앙대", en: "CAU" },
  hku: { kr: "홍익대", en: "Hongik" },
  ewha: { kr: "이화", en: "Ewha" },
  sogang: { kr: "서강대", en: "Sogang" },
  unist: { kr: "UNIST", en: "UNIST" },
  dgist: { kr: "DGIST", en: "DGIST" },
  postech: { kr: "포스텍", en: "POSTECH" },
};
