-- Anonymous post edit/delete: canonical password_hash + updated_at

ALTER TABLE study_korea_posts
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

COMMENT ON COLUMN study_korea_posts.password_hash IS
  'SHA256+salt hash of 4-digit edit/delete password (see lib/security/hash.ts)';

-- Backfill from legacy column
UPDATE study_korea_posts
SET password_hash = anonymous_password_hash
WHERE password_hash IS NULL
  AND anonymous_password_hash IS NOT NULL;
