-- Supabase SQL Editor에서 실행하세요.

create table if not exists public.admissions (
  id text primary key,
  university text not null,
  university_en text not null,
  major text not null,
  year integer not null,
  admission_type text not null,
  status text not null,
  created_at timestamptz not null default now(),
  source text not null,
  nationality text,
  username text,
  test_scores jsonb,
  gpa jsonb,
  special_skills jsonb,
  review text,
  likes integer default 0,
  comments jsonb,
  published boolean not null default true,
  pros text[],
  cons text[],
  tips text[],
  summary text,
  raw_content text,
  visa_type text,
  language_proficiency text,
  topik_level text
);

create index if not exists admissions_university_idx on public.admissions (university);
create index if not exists admissions_year_idx on public.admissions (year);
create index if not exists admissions_source_idx on public.admissions (source);
create index if not exists admissions_nationality_idx on public.admissions (nationality);

create table if not exists public.pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  pipeline_type text not null,
  status text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  records_processed integer,
  error_message text,
  metadata jsonb
);

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text not null,
  location text,
  type text,
  images jsonb,
  description text,
  created_at timestamptz not null default now()
);

alter table public.admissions enable row level security;
create policy "admissions read" on public.admissions for select using (true);
