export const STUDY_KOREA_CATEGORIES = [
  "admission",
  "scholarship",
  "visa",
  "dormitory",
  "life",
  "language",
  "cost",
  "general",
] as const;

export type StudyKoreaCategorySlug = (typeof STUDY_KOREA_CATEGORIES)[number];

export const CATEGORY_LABELS_KR: Record<string, string> = {
  all: "전체",
  admission: "입시",
  scholarship: "장학금",
  visa: "비자",
  dormitory: "기숙사",
  life: "생활",
  language: "어학",
  cost: "생활비",
  general: "일반",
};

export const CATEGORY_LABELS_EN: Record<string, string> = {
  all: "All",
  admission: "Admission",
  scholarship: "Scholarship",
  visa: "Visa",
  dormitory: "Dormitory",
  life: "Life",
  language: "Language",
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
};
