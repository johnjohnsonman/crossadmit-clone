-- study_korea_posts: 텍스트 콘텐츠 전용 (Naver, Reddit, Quora, 공식 페이지)
-- YouTube는 university_videos 테이블만 사용

ALTER TABLE study_korea_posts
  ADD COLUMN IF NOT EXISTS subcategory text DEFAULT '',
  ADD COLUMN IF NOT EXISTS university_id integer;

-- language 컬럼은 006에서 이미 존재 — 기본값만 조정 (신규 행)
ALTER TABLE study_korea_posts
  ALTER COLUMN language SET DEFAULT 'ko';

CREATE INDEX IF NOT EXISTS idx_study_korea_subcategory ON study_korea_posts(subcategory);
CREATE INDEX IF NOT EXISTS idx_study_korea_university_id ON study_korea_posts(university_id);
