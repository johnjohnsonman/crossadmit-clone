export type University = {
  id: number
  country: string
  name_kr: string
  name_en: string
  logo: string
  is_active: boolean
  continent?: string
  address?: string
  sort_order?: number
  created_at?: string
}

export type UniversityDepartment = {
  id: number
  univ_id: number
  dept_name: string
  dept_name_en: string
  is_active?: boolean
}

export type Admission = {
  id: number
  original_user_id: number
  user_handle: string
  year: number
  year_end: number
  title: string
  input_score: string
  input_gpa: string
  input_specialty: string
  view_count: number
  likes_count: number
  is_verified: boolean
  is_featured: boolean
  published: boolean
  source: string
  created_at: string
  admission_schools?: AdmissionSchool[]
  cross_comparisons?: CrossComparison[]
}

export type AdmissionSchool = {
  id: number
  admission_id: number
  univ_id: number
  dept_id: number
  univ_name: string
  dept_name: string
  is_apply: boolean
  is_accept: boolean
  is_regist: boolean
  is_grad: boolean
  admission_type: string
  review: string
  thumbnail: string
  is_active?: boolean
  created_at?: string | null
}

export type CrossComparison = {
  id: number
  admission_id: number
  univ_id_win: number
  univ_id_lose: number
  univ_name_win: string
  univ_name_lose: string
  dept_name_win: string
  dept_name_lose: string
  dept_id_win?: number
  dept_id_lose?: number
  count?: number
}

export type CrossComparisonStat = {
  univ_id_win: number
  univ_id_lose: number
  univ_name_win: string
  univ_name_lose: string
  dept_name_win: string
  dept_name_lose: string
  dept_id_win?: number
  dept_id_lose?: number
  count: number
  percentage_win: number
}

export type CommentRow = {
  id: string
  admission_id: number
  nickname: string
  content: string
  created_at: string
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      universities: {
        Row: University
        Insert: Partial<University> & Pick<University, "id" | "name_kr" | "name_en">
        Update: Partial<University>
        Relationships: []
      }
      university_departments: {
        Row: UniversityDepartment
        Insert: Partial<UniversityDepartment> & Pick<UniversityDepartment, "id" | "univ_id" | "dept_name">
        Update: Partial<UniversityDepartment>
        Relationships: []
      }
      admissions: {
        Row: Admission
        Insert: Omit<Admission, "admission_schools" | "cross_comparisons"> & {
          id?: number
        }
        Update: Partial<Admission>
        Relationships: []
      }
      admission_schools: {
        Row: AdmissionSchool
        Insert: Omit<AdmissionSchool, "id"> & { id?: number }
        Update: Partial<AdmissionSchool>
        Relationships: []
      }
      cross_comparisons: {
        Row: CrossComparison & { dept_id_win?: number; dept_id_lose?: number; is_active?: boolean }
        Insert: Partial<CrossComparison>
        Update: Partial<CrossComparison>
        Relationships: []
      }
      comments: {
        Row: CommentRow & { password_hash: string; is_deleted: boolean; ip_hash: string | null }
        Insert: {
          admission_id: number
          nickname?: string
          password_hash: string
          content: string
          is_deleted?: boolean
          ip_hash?: string | null
        }
        Update: Partial<CommentRow>
        Relationships: []
      }
      pipeline_runs: {
        Row: {
          id: string
          pipeline_type: string
          status: string
          started_at: string
          completed_at: string | null
          records_processed: number | null
          error_message: string | null
          metadata: Json | null
        }
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
      university_videos: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type AdmissionsInsert =
  Database["public"]["Tables"]["admissions"]["Insert"];
