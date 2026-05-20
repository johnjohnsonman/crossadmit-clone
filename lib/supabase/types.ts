export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      admissions: {
        Row: {
          id: string;
          university: string;
          university_en: string;
          major: string;
          year: number;
          admission_type: string;
          status: string;
          created_at: string;
          source: string;
          nationality: string | null;
          username: string | null;
          test_scores: Json | null;
          gpa: Json | null;
          special_skills: Json | null;
          review: string | null;
          likes: number | null;
          comments: Json | null;
          published: boolean;
          pros: string[] | null;
          cons: string[] | null;
          tips: string[] | null;
          summary: string | null;
          raw_content: string | null;
          visa_type: string | null;
          language_proficiency: string | null;
          topik_level: string | null;
        };
        Insert: {
          id: string;
          university: string;
          university_en: string;
          major: string;
          year: number;
          admission_type: string;
          status: string;
          created_at?: string;
          source: string;
          nationality?: string | null;
          username?: string | null;
          test_scores?: Json | null;
          gpa?: Json | null;
          special_skills?: Json | null;
          review?: string | null;
          likes?: number | null;
          comments?: Json | null;
          published?: boolean;
          pros?: string[] | null;
          cons?: string[] | null;
          tips?: string[] | null;
          summary?: string | null;
          raw_content?: string | null;
          visa_type?: string | null;
          language_proficiency?: string | null;
          topik_level?: string | null;
        };
        Update: {
          id?: string;
          university?: string;
          university_en?: string;
          major?: string;
          year?: number;
          admission_type?: string;
          status?: string;
          created_at?: string;
          source?: string;
          nationality?: string | null;
          username?: string | null;
          test_scores?: Json | null;
          gpa?: Json | null;
          special_skills?: Json | null;
          review?: string | null;
          likes?: number | null;
          comments?: Json | null;
          published?: boolean;
          pros?: string[] | null;
          cons?: string[] | null;
          tips?: string[] | null;
          summary?: string | null;
          raw_content?: string | null;
          visa_type?: string | null;
          language_proficiency?: string | null;
          topik_level?: string | null;
        };
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
      universities: {
        Row: {
          id: string;
          name: string;
          name_en: string;
          location: string | null;
          type: string | null;
          images: Json | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_en: string;
          location?: string | null;
          type?: string | null;
          images?: Json | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_en?: string;
          location?: string | null;
          type?: string | null;
          images?: Json | null;
          description?: string | null;
          created_at?: string;
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
          /** generated: array_to_string(university_tags) */
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
          university_tags_search?: never;
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
          university_tags_search?: never;
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

export type AdmissionsRow =
  Database["public"]["Tables"]["admissions"]["Row"];
export type AdmissionsInsert =
  Database["public"]["Tables"]["admissions"]["Insert"];
export type PipelineRunsRow =
  Database["public"]["Tables"]["pipeline_runs"]["Row"];
export type UniversitiesRow =
  Database["public"]["Tables"]["universities"]["Row"];
export type UniversityVideosRow =
  Database["public"]["Tables"]["university_videos"]["Row"];
