/** 한국 대학 한글/영문 쌍 (자동완성·제출용) */
export type KoreanUniversity = { nameKo: string; nameEn: string };

export const KOREAN_UNIVERSITIES: KoreanUniversity[] = [
  // 서울권
  { nameKo: "서울대학교", nameEn: "Seoul National University" },
  { nameKo: "연세대학교", nameEn: "Yonsei University" },
  { nameKo: "고려대학교", nameEn: "Korea University" },
  { nameKo: "성균관대학교", nameEn: "Sungkyunkwan University" },
  { nameKo: "한양대학교", nameEn: "Hanyang University" },
  { nameKo: "서강대학교", nameEn: "Sogang University" },
  { nameKo: "이화여자대학교", nameEn: "Ewha Womans University" },
  { nameKo: "중앙대학교", nameEn: "Chung-Ang University" },
  { nameKo: "경희대학교", nameEn: "Kyung Hee University" },
  {
    nameKo: "한국외국어대학교",
    nameEn: "Hankuk University of Foreign Studies",
  },
  { nameKo: "서울시립대학교", nameEn: "University of Seoul" },
  { nameKo: "건국대학교", nameEn: "Konkuk University" },
  { nameKo: "동국대학교", nameEn: "Dongguk University" },
  { nameKo: "홍익대학교", nameEn: "Hongik University" },
  { nameKo: "국민대학교", nameEn: "Kookmin University" },
  { nameKo: "숙명여자대학교", nameEn: "Sookmyung Women's University" },
  { nameKo: "세종대학교", nameEn: "Sejong University" },
  { nameKo: "단국대학교", nameEn: "Dankook University" },
  { nameKo: "광운대학교", nameEn: "Kwangwoon University" },
  { nameKo: "명지대학교", nameEn: "Myongji University" },
  { nameKo: "덕성여자대학교", nameEn: "Duksung Women's University" },
  { nameKo: "동덕여자대학교", nameEn: "Dongduk Women's University" },
  { nameKo: "성신여자대학교", nameEn: "Sungshin Women's University" },
  { nameKo: "삼육대학교", nameEn: "Sahmyook University" },
  { nameKo: "서울여자대학교", nameEn: "Seoul Women's University" },
  {
    nameKo: "가톨릭대학교",
    nameEn: "The Catholic University of Korea",
  },
  { nameKo: "상명대학교", nameEn: "Sangmyung University" },
  {
    nameKo: "추계예술대학교",
    nameEn: "Chugye University for the Arts",
  },
  { nameKo: "한성대학교", nameEn: "Hansung University" },
  // 이공계
  { nameKo: "KAIST", nameEn: "KAIST" },
  { nameKo: "POSTECH", nameEn: "POSTECH" },
  { nameKo: "UNIST", nameEn: "UNIST" },
  { nameKo: "GIST", nameEn: "GIST" },
  { nameKo: "DGIST", nameEn: "DGIST" },
  // 수도권
  { nameKo: "아주대학교", nameEn: "Ajou University" },
  { nameKo: "인하대학교", nameEn: "Inha University" },
  { nameKo: "경기대학교", nameEn: "Kyonggi University" },
  { nameKo: "수원대학교", nameEn: "University of Suwon" },
  { nameKo: "인천대학교", nameEn: "Incheon National University" },
  { nameKo: "가천대학교", nameEn: "Gachon University" },
  {
    nameKo: "한국항공대학교",
    nameEn: "Korea Aerospace University",
  },
  {
    nameKo: "한국산업기술대학교",
    nameEn: "Korea Polytechnic University",
  },
  // 지방거점국립대
  { nameKo: "부산대학교", nameEn: "Pusan National University" },
  { nameKo: "경북대학교", nameEn: "Kyungpook National University" },
  { nameKo: "전남대학교", nameEn: "Chonnam National University" },
  { nameKo: "충남대학교", nameEn: "Chungnam National University" },
  { nameKo: "충북대학교", nameEn: "Chungbuk National University" },
  { nameKo: "전북대학교", nameEn: "Jeonbuk National University" },
  { nameKo: "강원대학교", nameEn: "Kangwon National University" },
  { nameKo: "제주대학교", nameEn: "Jeju National University" },
  {
    nameKo: "경상국립대학교",
    nameEn: "Gyeongsang National University",
  },
  // 기타 주요 (중복 제거: POSTECH/UNIST/한림 등)
  { nameKo: "한동대학교", nameEn: "Handong Global University" },
  { nameKo: "한림대학교", nameEn: "Hallym University" },
  { nameKo: "강남대학교", nameEn: "Kangnam University" },
  { nameKo: "협성대학교", nameEn: "Hyupsung University" },
];

/** 자동완성·제출 시 교명 정규화 */
export function resolveUniversityInput(input: string): {
  nameKo: string;
  nameEn: string;
} {
  const t = input.trim();
  if (!t) return { nameKo: "", nameEn: "" };
  const byKo = KOREAN_UNIVERSITIES.find((u) => u.nameKo === t);
  if (byKo) return { nameKo: byKo.nameKo, nameEn: byKo.nameEn };
  const byEn = KOREAN_UNIVERSITIES.find(
    (u) => u.nameEn.toLowerCase() === t.toLowerCase()
  );
  if (byEn) return { nameKo: byEn.nameKo, nameEn: byEn.nameEn };
  return { nameKo: t, nameEn: t };
}
