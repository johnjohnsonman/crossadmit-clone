-- Mentor opt-in on admissions (international stories)

ALTER TABLE admissions ADD COLUMN IF NOT EXISTS available_as_mentor boolean NOT NULL DEFAULT false;
ALTER TABLE admissions ADD COLUMN IF NOT EXISTS mentor_intro text;
