export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** 도메인 타입 (앱·API 공용) */
export type University = {
  id: number;
  country: string;
  name_kr: string;
  name_en: string;
  logo: string;
  is_active: boolean;
  intl_url?: string;
  intl_url_verified?: boolean;
};

import type { AdmitTrack, SourceType } from "@/lib/admissions/admit-track";
import type { DegreeLevel } from "@/lib/admissions/degree-level";

export type { AdmitTrack, SourceType, DegreeLevel };

export type UniversityDepartment = {
  id: number;
  univ_id: number;
  dept_name: string;
  dept_name_en: string;
};

export type Admission = {
  id: number;
  original_user_id: number;
  user_handle: string;
  year: number;
  year_end: number;
  title: string;
  input_score: string;
  input_gpa: string;
  input_specialty: string;
  view_count: number;
  likes_count: number;
  is_verified: boolean;
  is_featured: boolean;
  published: boolean;
  source: string;
  source_url?: string | null;
  admit_track?: AdmitTrack | string | null;
  degree_level?: DegreeLevel | string | null;
  source_type?: SourceType | string | null;
  home_country?: string | null;
  high_school_type?: string | null;
  available_as_mentor?: boolean;
  mentor_intro?: string | null;
  created_at: string;
  admission_schools?: AdmissionSchool[];
};

export type AdmissionSchool = {
  id: number;
  admission_id: number;
  univ_id: number | null;
  dept_id: number | null;
  univ_name: string;
  dept_name: string;
  is_apply: boolean;
  is_accept: boolean;
  is_regist: boolean;
  is_grad: boolean;
  admission_type: string;
  review: string;
  thumbnail: string;
};

export type CrossComparison = {
  id: number;
  admission_id: number;
  univ_id_win: number;
  univ_id_lose: number;
  univ_name_win: string;
  univ_name_lose: string;
  dept_name_win: string;
  dept_name_lose: string;
  count?: number;
};

export type Comment = {
  id: string;
  admission_id: number;
  nickname: string;
  password_hash: string;
  content: string;
  is_deleted: boolean;
  ip_hash: string | null;
  created_at: string;
};

/** Supabase generated-style Database */
export interface Database {
  public: {
    Tables: {
      universities: {
        Row: University;
        Insert: Partial<University> & Pick<University, "country" | "name_kr" | "name_en">;
        Update: Partial<University>;
        Relationships: [];
      };
      university_departments: {
        Row: UniversityDepartment;
        Insert: Partial<UniversityDepartment> & Pick<UniversityDepartment, "univ_id" | "dept_name">;
        Update: Partial<UniversityDepartment>;
        Relationships: [];
      };
      admissions: {
        Row: Omit<Admission, "admission_schools">;
        Insert: Partial<Omit<Admission, "id" | "admission_schools">> &
          Pick<Admission, "user_handle" | "year" | "title">;
        Update: Partial<Omit<Admission, "admission_schools">>;
        Relationships: [];
      };
      admission_schools: {
        Row: AdmissionSchool;
        Insert: Partial<AdmissionSchool> &
          Pick<AdmissionSchool, "admission_id" | "univ_name" | "dept_name">;
        Update: Partial<AdmissionSchool>;
        Relationships: [];
      };
      cross_comparisons: {
        Row: CrossComparison;
        Insert: Partial<CrossComparison> &
          Pick<
            CrossComparison,
            | "admission_id"
            | "univ_id_win"
            | "univ_id_lose"
            | "univ_name_win"
            | "univ_name_lose"
            | "dept_name_win"
            | "dept_name_lose"
          >;
        Update: Partial<CrossComparison>;
        Relationships: [];
      };
      comments: {
        Row: Comment;
        Insert: {
          id?: string;
          admission_id: number;
          nickname?: string;
          password_hash: string;
          content: string;
          is_deleted?: boolean;
          ip_hash?: string | null;
          created_at?: string;
        };
        Update: Partial<Comment>;
        Relationships: [];
      };
      pipeline_runs: {
        Row: {
          id: string;
          pipeline_type: string;
          status: string;
          started_at: string;
          completed_at: string | null;
          records_processed: number | null;
          error_message: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          pipeline_type: string;
          status: string;
          started_at?: string;
          completed_at?: string | null;
          records_processed?: number | null;
          error_message?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          pipeline_type?: string;
          status?: string;
          started_at?: string;
          completed_at?: string | null;
          records_processed?: number | null;
          error_message?: string | null;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      university_videos: {
        Row: {
          id: string;
          video_id: string;
          title: string;
          description: string | null;
          channel_name: string | null;
          channel_id: string | null;
          thumbnail_url: string | null;
          view_count: number | null;
          published_at: string | null;
          duration_seconds: number | null;
          source_url: string;
          language: string | null;
          content_type: string | null;
          university_tags: string[] | null;
          university_tags_search?: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          title: string;
          description?: string | null;
          channel_name?: string | null;
          channel_id?: string | null;
          thumbnail_url?: string | null;
          view_count?: number | null;
          published_at?: string | null;
          duration_seconds?: number | null;
          source_url: string;
          language?: string | null;
          content_type?: string | null;
          university_tags?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          video_id?: string;
          title?: string;
          description?: string | null;
          channel_name?: string | null;
          channel_id?: string | null;
          thumbnail_url?: string | null;
          view_count?: number | null;
          published_at?: string | null;
          duration_seconds?: number | null;
          source_url?: string;
          language?: string | null;
          content_type?: string | null;
          university_tags?: string[] | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type AdmissionsRow = Database["public"]["Tables"]["admissions"]["Row"];
export type AdmissionsInsert = Database["public"]["Tables"]["admissions"]["Insert"];
export type AdmissionSchoolRow =
  Database["public"]["Tables"]["admission_schools"]["Row"];
export type AdmissionSchoolInsert =
  Database["public"]["Tables"]["admission_schools"]["Insert"];
export type CrossComparisonRow =
  Database["public"]["Tables"]["cross_comparisons"]["Row"];
export type CrossComparisonInsert =
  Database["public"]["Tables"]["cross_comparisons"]["Insert"];
export type UniversityRow = Database["public"]["Tables"]["universities"]["Row"];
export type UniversityDepartmentRow =
  Database["public"]["Tables"]["university_departments"]["Row"];
export type CommentsRow = Database["public"]["Tables"]["comments"]["Row"];
export type PipelineRunsRow =
  Database["public"]["Tables"]["pipeline_runs"]["Row"];
export type UniversityVideosRow =
  Database["public"]["Tables"]["university_videos"]["Row"];

/** admissions + nested schools (Supabase select) */
export type AdmissionWithSchools = Admission;
