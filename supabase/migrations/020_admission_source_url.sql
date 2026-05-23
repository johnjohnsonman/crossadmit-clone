-- 자동 수집 합격 후기 원문 URL
ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS source_url text;

COMMENT ON COLUMN admissions.source_url IS 'auto_collected 시 study_korea_posts 원문 URL';

UPDATE admissions
SET source = 'user_submission'
WHERE source IS NULL OR source = '';
