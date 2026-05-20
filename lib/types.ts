export interface AdmissionRecord {
  id: string;
  university: string;
  universityEn: string;
  major: string;
  year: number;
  admissionType: string;
  /** DB 값: 합격 / 등록 / 불합격 등 */
  status: string;
  createdAt: Date;
  source: string;
  /** 상세 후기 요약(신규 스키마) */
  summary?: string;
  rawContent?: string;
  pros?: string[];
  cons?: string[];
  tips?: string[];
  visaType?: string;
  languageProficiency?: string;
  /** 합격DB 공개 여부 */
  published?: boolean;
  /** 관리자 검증(사용자 제출) */
  verified?: boolean;
  topikGrade?: number | null;
  studentHandle?: string | null;
  topikLevel?: string;
  nationality?: string | null;
  // 상세 정보
  username?: string;
  testScores?: Record<string, unknown> | null;
  gpa?: {
    unweighted?: string;
    weighted?: string;
    ap?: string[];
    dualEnrollment?: string;
  } | null;
  specialSkills?: string[];
  review?: string;
  likes?: number;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
  isAnonymous?: boolean;
}

export interface AdmissionFilters {
  university?: string;
  major?: string;
  year?: number;
  admissionType?: string;
  status?: string;
}

export interface ForumPost {
  id: string;
  university: string;
  title: string;
  category: string;
  views: number;
  likes: number;
  date: string;
  content?: string;
}

export interface FamousAlumni {
  id: string;
  name: string;
  university: string;
  major?: string;
  description: string;
  imageUrl?: string;
}

export interface UniversityInfo {
  id: string;
  name: string;
  nameEn: string;
  location: string;
  type: "국립" | "사립" | "외국";
  images: string[];
  description: string;
}
