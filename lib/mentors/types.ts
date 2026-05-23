export type MentorTag = {
  id: number;
  tag_kr: string;
  tag_en: string;
  tag_type: number;
};

export type MentorUniversity = {
  id: number;
  name_kr: string;
  name_en: string;
  country: string;
  logo: string;
} | null;

export type MentorTagLink = {
  tag: MentorTag | null;
};

export type MentorRow = {
  id: string;
  legacy_id: number | null;
  nickname: string;
  greeting: string | null;
  greeting_en: string | null;
  intro_kr: string;
  intro_en: string | null;
  student_status: string | null;
  offers_admission: boolean;
  offers_career: boolean;
  price_admission_usd: number;
  price_career_usd: number;
  view_count: number;
  is_legacy: boolean;
  university_id: number | null;
  university_name_freetext: string | null;
  legacy_created_at: string | null;
  created_at: string;
  service_time: string | null;
  university: MentorUniversity;
  tags: MentorTagLink[];
};

export type MentorSearchParams = {
  q?: string;
  country?: string;
  offers?: string;
  price?: string;
  sort?: string;
  page?: number;
  limit?: number;
};

export type MentorSearchResult = {
  mentors: MentorRow[];
  total: number;
  page: number;
  limit: number;
};
