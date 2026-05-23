export const dictionary = {
  ko: {
    nav_crossadmit: "크로스어드밋",
    nav_forum: "포럼",
    nav_admissions: "합격DB",
    nav_mentors: "멘토",
    nav_guide: "유학가이드",
    nav_videos: "유학영상",
    nav_login: "로그인",
    nav_signup: "회원가입",

    forum_title: "유학 포럼",
    forum_subtitle: "외국인 유학생들의 한국 유학 경험과 정보를 공유합니다",
    forum_all: "전체",
    forum_admission: "입시정보",
    forum_scholarship: "장학금",
    forum_dormitory: "기숙사",
    forum_visa: "비자",
    forum_life: "생활",
    forum_language: "어학",
    forum_filter_placeholder: "대학명으로 필터...",
    forum_post_count: "총 {n}개 게시글",
    forum_empty: "게시글이 없습니다.",
    forum_popular_univ: "인기 대학",
    forum_popular_subtitle: "크로스 비교 데이터 기준",
    forum_popular_empty: "데이터 없음",
    forum_external_link: "외부 링크 →",
    forum_summary_prefix: "AI 요약: ",
    forum_clear_filter: "필터 초기화",
    forum_prev: "이전",
    forum_next: "다음",
    forum_admissions_link: "→ 합격DB 보기",
    forum_sub_general: "일반",

    admissions_title: "합격 DB",
    admissions_subtitle: "선배들의 합격 경험을 확인하세요",

    crossadmit_title: "크로스어드밋",
    crossadmit_subtitle: "두 대학에 동시에 합격했을 때, 학생들은 어디를 선택할까요?",
    crossadmit_note:
      "통계적으로 유의미한 차이가 있는 경우 색상으로 표시됩니다 (95% 신뢰구간)",
    crossadmit_register: "내 학교 등록 인증하기 →",

    footer_brand: "크로스어드밋",
    footer_about: "ABOUT US",
    footer_contact: "CONTACT",
    footer_legal: "법적 고지",
    footer_privacy: "개인정보처리방침",
    footer_terms: "이용약관",
    footer_contact_info: "연락처",
    footer_business: "사업자등록번호: 662-27-00450",
    footer_customer: "고객센터: 카카오톡 '크로스어드밋'",
    footer_email: "이메일: hello@chairpark.com",
    footer_social: "소셜",
    footer_kakao: "카카오톡",
    footer_copyright: "Copyright ⓒ CrossAdmit.com All right reserved",

    loading: "불러오는 중…",
  },
  en: {
    nav_crossadmit: "CrossAdmit",
    nav_forum: "Forum",
    nav_admissions: "Admissions DB",
    nav_mentors: "Mentors",
    nav_guide: "Study Guide",
    nav_videos: "Videos",
    nav_login: "Log in",
    nav_signup: "Sign up",

    forum_title: "Study Korea Forum",
    forum_subtitle: "Share Korean study abroad experiences and information",
    forum_all: "All",
    forum_admission: "Admissions",
    forum_scholarship: "Scholarship",
    forum_dormitory: "Dormitory",
    forum_visa: "Visa",
    forum_life: "Life",
    forum_language: "Language",
    forum_filter_placeholder: "Filter by university...",
    forum_post_count: "{n} posts",
    forum_empty: "No posts found.",
    forum_popular_univ: "Popular Universities",
    forum_popular_subtitle: "Based on cross comparison data",
    forum_popular_empty: "No data",
    forum_external_link: "Open →",
    forum_summary_prefix: "AI summary: ",
    forum_clear_filter: "Clear",
    forum_prev: "Prev",
    forum_next: "Next",
    forum_admissions_link: "→ Admissions DB",
    forum_sub_general: "General",

    admissions_title: "Admissions DB",
    admissions_subtitle: "Check the admission experiences of seniors",

    crossadmit_title: "CrossAdmit",
    crossadmit_subtitle:
      "When admitted to two universities, which do students choose?",
    crossadmit_note:
      "Statistically significant differences are highlighted (95% CI)",
    crossadmit_register: "Register your school →",

    footer_brand: "CrossAdmit",
    footer_about: "ABOUT US",
    footer_contact: "CONTACT",
    footer_legal: "Legal",
    footer_privacy: "Privacy Policy",
    footer_terms: "Terms of Service",
    footer_contact_info: "Contact",
    footer_business: "Business Reg.: 662-27-00450",
    footer_customer: "Customer Center: KakaoTalk 'CrossAdmit'",
    footer_email: "Email: hello@chairpark.com",
    footer_social: "Social",
    footer_kakao: "KakaoTalk",
    footer_copyright: "Copyright ⓒ CrossAdmit.com All rights reserved",

    loading: "Loading…",
  },
} as const;

export type Locale = keyof typeof dictionary;
export type Dictionary = (typeof dictionary)[Locale];

export function getDictionary(locale: Locale): Dictionary {
  return dictionary[locale];
}

export function formatDict(
  template: string,
  vars: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`
  );
}
