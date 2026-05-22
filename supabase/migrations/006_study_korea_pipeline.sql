-- Same as 008_study_korea_pipeline.sql (requested filename for manual SQL Editor run)
-- Study in Korea content pipeline (Reddit + YouTube)

CREATE TABLE IF NOT EXISTS study_korea_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  source_id text NOT NULL,
  title text DEFAULT '',
  content text DEFAULT '',
  url text DEFAULT '',
  author text DEFAULT '',
  category text DEFAULT 'general',
  university text DEFAULT '',
  language text DEFAULT 'en',
  upvotes integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  ai_summary text DEFAULT '',
  ai_summary_kr text DEFAULT '',
  ai_tags text[] DEFAULT '{}',
  is_published boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  source_created_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(source, source_id)
);

CREATE INDEX IF NOT EXISTS idx_study_korea_source ON study_korea_posts(source);
CREATE INDEX IF NOT EXISTS idx_study_korea_category ON study_korea_posts(category);
CREATE INDEX IF NOT EXISTS idx_study_korea_university ON study_korea_posts(university);
CREATE INDEX IF NOT EXISTS idx_study_korea_published ON study_korea_posts(is_published);

ALTER TABLE study_korea_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read study_korea_posts" ON study_korea_posts;
CREATE POLICY "Allow public read study_korea_posts"
  ON study_korea_posts FOR SELECT USING (is_published = true);

CREATE TABLE IF NOT EXISTS pipeline_runs_study_korea (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  query text DEFAULT '',
  collected integer DEFAULT 0,
  processed integer DEFAULT 0,
  saved integer DEFAULT 0,
  failed integer DEFAULT 0,
  status text DEFAULT 'running',
  error_message text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
