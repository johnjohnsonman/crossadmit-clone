export interface AdmissionRecord {
  id: string;
  university: string;
  universityEn: string;
  major: string;
  year: number;
  admissionType: string;
  status: "합격" | "등록";
  createdAt: Date;
  source: "web" | "generated";
  // 상세 정보
  username?: string;
  testScores?: {
    type: string; // "Test optional", "SAT", "ACT" 등
    score?: string;
  };
  gpa?: {
    unweighted?: string; // "4.0/4.0"
    weighted?: string; // "4.4/4.4"
    ap?: string[];
    dualEnrollment?: string;
  };
  specialSkills?: string[];
  review?: string; // 후기 및 학교 선택 이유
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
  status?: "합격" | "등록";
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
