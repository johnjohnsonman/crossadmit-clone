-- Mentor listing performance (run in Supabase SQL Editor)

CREATE INDEX IF NOT EXISTS idx_admissions_mentor_opt_in
  ON admissions(available_as_mentor, admit_track, created_at DESC)
  WHERE available_as_mentor = true AND published = true;
