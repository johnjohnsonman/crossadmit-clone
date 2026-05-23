-- 합격 후기 자동 수집 → study_korea_posts 검토 대기 큐
ALTER TABLE study_korea_posts
ADD COLUMN IF NOT EXISTS is_admission_post boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_study_korea_admission
ON study_korea_posts(is_admission_post, is_published)
WHERE is_admission_post = true;
