export const MENTOR_PAGE_SIZE = 24;

export const MENTOR_CARD_SELECT = `
  id, legacy_id, nickname, greeting, greeting_en, intro_kr, intro_en,
  student_status, offers_admission, offers_career,
  price_admission_usd, price_career_usd, view_count,
  is_legacy, university_id, university_name_freetext, legacy_created_at, created_at,
  service_time,
  university:universities!university_id (
    id, name_kr, name_en, country, logo
  ),
  tags:mentor_tag_links (
    tag:mentor_tag_dict (
      id, tag_kr, tag_en, tag_type
    )
  )
`;

export const COUNTRY_FILTER_MAP: Record<string, string> = {
  kr: "KR",
  us: "US",
  gb: "GB",
};
