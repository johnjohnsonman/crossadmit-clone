-- Track last AI reclassification pass (run manually in Supabase SQL Editor)

ALTER TABLE study_korea_posts
  ADD COLUMN IF NOT EXISTS recently_reclassified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_study_korea_reclassified
  ON study_korea_posts (recently_reclassified_at);
