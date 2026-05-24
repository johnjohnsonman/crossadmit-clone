-- Scraped admission classifier + review queue

ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS needs_review boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS classifier_confidence numeric(3,2),
  ADD COLUMN IF NOT EXISTS classifier_reasoning text,
  ADD COLUMN IF NOT EXISTS raw_content text;

CREATE INDEX IF NOT EXISTS idx_admissions_needs_review
  ON admissions(needs_review, created_at DESC)
  WHERE needs_review = true;

CREATE INDEX IF NOT EXISTS idx_admissions_source_url
  ON admissions(source_url)
  WHERE source_url IS NOT NULL;

ALTER TABLE pipeline_runs_study_korea
  ADD COLUMN IF NOT EXISTS routed_admissions int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS routed_review int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS routed_general int DEFAULT 0;
