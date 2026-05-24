-- International submission metadata (run in Supabase SQL Editor)

ALTER TABLE admissions ADD COLUMN IF NOT EXISTS home_country text;
ALTER TABLE admissions ADD COLUMN IF NOT EXISTS high_school_type text;

CREATE INDEX IF NOT EXISTS idx_admissions_home_country ON admissions(home_country);
