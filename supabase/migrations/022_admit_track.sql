-- admit_track: dual-audience classification (KR domestic vs international pipeline)
-- Run in Supabase SQL Editor if not applied via CLI.

ALTER TABLE admissions
  ADD COLUMN IF NOT EXISTS admit_track text
  DEFAULT 'regular_kr'
  CHECK (admit_track IN (
    'regular_kr',
    'overseas_kr',
    'international',
    'gks',
    'graduate',
    'abroad',
    'unknown'
  ));

CREATE INDEX IF NOT EXISTS idx_admissions_admit_track
  ON admissions(admit_track);

-- Heuristic backfill for existing rows
UPDATE admissions SET admit_track = 'graduate'
WHERE input_score ILIKE '%GMAT%'
   OR input_score ILIKE '%LEET%'
   OR input_score ILIKE '%LSAT%'
   OR title ILIKE '%MBA%' OR title ILIKE '%로스쿨%' OR title ILIKE '%대학원%';

UPDATE admissions SET admit_track = 'abroad'
WHERE (input_score ILIKE '%SAT%' OR input_score ILIKE '%ACT %')
  AND admit_track = 'regular_kr';

UPDATE admissions SET admit_track = 'overseas_kr'
WHERE title ILIKE '%재외국민%' OR title ILIKE '%재외%';

ALTER TABLE admissions ADD COLUMN IF NOT EXISTS source_type text;

UPDATE admissions SET source_type = 'mysql_original'
WHERE source_type IS NULL;
