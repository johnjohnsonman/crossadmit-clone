alter table admissions
  add column if not exists nationality_code text,
  add column if not exists nationality_region text,
  add column if not exists gender text;
