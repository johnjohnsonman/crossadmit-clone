-- English AI fields for study_korea_posts (run manually in Supabase SQL Editor)

ALTER TABLE study_korea_posts
  ADD COLUMN IF NOT EXISTS ai_title_en text DEFAULT '',
  ADD COLUMN IF NOT EXISTS ai_summary_en text DEFAULT '',
  ADD COLUMN IF NOT EXISTS ai_content_en text DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_study_korea_title_en
  ON study_korea_posts (ai_title_en);
