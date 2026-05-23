/** UI/API 레이어 (camelCase) */
export interface AdmissionSchoolRecord {
  id: number;
  admissionId: number;
  univId: number;
  deptId: number;
  univName: string;
  deptName: string;
  isApply: boolean;
  isAccept: boolean;
  isRegist: boolean;
  isGrad: boolean;
  admissionType: string;
  review?: string;
  thumbnail?: string;
}

export interface CrossComparisonRecord {
  id: number;
  admissionId: number;
  univIdWin: number;
  univIdLose: number;
  univNameWin: string;
  univNameLose: string;
  deptNameWin: string;
  deptNameLose: string;
  count?: number;
}

export interface AdmissionRecord {
  id: number;
  userHandle: string;
  year: number;
  yearEnd?: number;
  title: string;
  inputScore?: string;
  inputGpa?: string;
  inputSpecialty?: string;
  viewCount: number;
  likesCount: number;
  isVerified: boolean;
  isFeatured: boolean;
  published: boolean;
  source: string;
  sourceUrl?: string;
  createdAt: Date;
  admissionSchools: AdmissionSchoolRecord[];
  crossComparisons?: CrossComparisonRecord[];
  dcCommentCount?: number;
}

export interface AdmissionFilters {
  year?: number;
  admissionType?: string;
  search?: string;
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
  id: number;
  name: string;
  nameEn: string;
  country: string;
  logo?: string;
}
