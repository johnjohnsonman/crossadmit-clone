ALTER TABLE admissions 
  ADD COLUMN IF NOT EXISTS original_language text DEFAULT 'en'
  CHECK (original_language IN ('en', 'ko', 'vi', 'zh', 'mn', 'uz', 'ne', 'my', 'ja', 'ru', 'es', 'ar', 'other'));

ALTER TABLE admissions 
  ADD COLUMN IF NOT EXISTS original_content text;

ALTER TABLE admissions 
  ADD COLUMN IF NOT EXISTS original_title text;

CREATE INDEX IF NOT EXISTS idx_admissions_original_language 
  ON admissions(original_language);

-- 기존 데이터는 영어 또는 한국어로 가정하여 분류
UPDATE admissions 
SET original_language = 'ko'
WHERE original_language = 'en'
  AND (
    title ~ '[가-힣]' 
    OR input_specialty ~ '[가-힣]'
  );

-- 영어 모드 user_submitted_intl은 영어로 유지 (기본값)
-- 한국어 폼 제출분은 한국어로 분류됨 (위 UPDATE)
