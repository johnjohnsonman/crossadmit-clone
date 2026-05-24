/** 외국인 한국 유학·합격 후기 수집용 Naver webkr 검색 쿼리 (한국인 입시 제외) */

export function buildAdmissionQueries(): string[] {
  const queries: string[] = [];

  // === 영어 (메인) ===
  queries.push(
    "admitted to Korea University",
    "admitted to Seoul National University",
    "admitted to Yonsei University",
    "admitted to KAIST",
    "admitted to POSTECH",
    "admitted to Korean university",
    "got into Korean university",
    "accepted to SNU",
    "accepted to Yonsei",
    "accepted to Korea Univ",
    "GKS scholarship admitted",
    "GKS scholarship recipient",
    "Korean Government Scholarship",
    "Global Korea Scholarship 2024",
    "Global Korea Scholarship 2025",
    "KAIST scholarship international",
    "studying in Korea experience",
    "international student Korea admission",
    "foreign student Korean university",
    "Korean university application tips",
    "my experience studying in Korea",
    "how I got accepted Korean university",
    "D-2 student visa Korea experience",
    "Korean student visa application",
    "TOPIK passed admission",
    "TOPIK level admission Korea"
  );

  // === 한국어 (외국인 관점) ===
  queries.push(
    "외국인 한국 유학 합격",
    "외국인 전형 합격",
    "GKS 합격 후기",
    "GKS 장학금 합격",
    "한국 유학생 인터뷰",
    "외국인 유학생 합격",
    "국제처 합격 후기",
    "외국인 한국대학 입학",
    "한국 유학 베트남 학생",
    "한국 유학 중국 학생",
    "한국 유학 미국 학생"
  );

  // === 중국어 ===
  queries.push(
    "韩国留学 申请 录取",
    "韩国大学 留学生",
    "GKS奖学金",
    "首尔大学 留学",
    "高丽大学 申学",
    "中国学生 韩国留学"
  );

  // === 베트남어 ===
  queries.push(
    "du học Hàn Quốc trúng tuyển",
    "GKS Hàn Quốc",
    "kinh nghiệm du học Hàn Quốc"
  );

  // === 한국 대학 + international ===
  const koreanUnis = [
    "Seoul National University international",
    "Yonsei University international students",
    "Korea University international",
    "KAIST international students",
    "Hanyang University international",
    "Sungkyunkwan University international",
  ];
  for (const uni of koreanUnis) {
    queries.push(`${uni} admission`);
  }

  return queries;
}

export const ADMISSION_QUERIES = buildAdmissionQueries();

export const ADMISSION_QUERY_COUNT = ADMISSION_QUERIES.length;
