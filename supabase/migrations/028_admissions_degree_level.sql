-- degree_level: 학위 단계 (admit_track과 분리)
-- Run in Supabase SQL Editor. Data backfill SQL은 별도(보고서 참고).

ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS degree_level text DEFAULT 'unknown'
  CHECK (degree_level IN ('undergraduate', 'graduate', 'mba', 'law', 'unknown'));

CREATE INDEX IF NOT EXISTS idx_admissions_degree_level
  ON admissions(degree_level);

CREATE INDEX IF NOT EXISTS idx_admissions_track_level
  ON admissions(admit_track, degree_level);
