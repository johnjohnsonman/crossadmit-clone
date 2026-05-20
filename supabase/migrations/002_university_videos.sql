-- Supabase SQL Editor 또는 migration으로 실행

CREATE TABLE IF NOT EXISTS public.university_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  channel_name text,
  channel_id text,
  thumbnail_url text,
  view_count integer DEFAULT 0,
  published_at timestamptz,
  duration_seconds integer,
  source_url text NOT NULL,
  language text DEFAULT 'en',
  content_type text DEFAULT 'general',
  university_tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_university_videos_video_id ON public.university_videos(video_id);
CREATE INDEX IF NOT EXISTS idx_university_videos_university_tags ON public.university_videos USING gin(university_tags);
CREATE INDEX IF NOT EXISTS idx_university_videos_language ON public.university_videos(language);
CREATE INDEX IF NOT EXISTS idx_university_videos_view_count ON public.university_videos(view_count DESC);

ALTER TABLE public.university_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on university_videos" ON public.university_videos;
CREATE POLICY "Allow public read on university_videos" ON public.university_videos
  FOR SELECT USING (true);
