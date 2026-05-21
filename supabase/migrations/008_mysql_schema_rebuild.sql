-- MySQL crossadmin 스키마 기반 재구축
-- ⚠️ Supabase SQL Editor에서 실행 전 백업 권장

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'admissions') then
    alter table public.admissions rename to admissions_legacy_flat;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'universities') then
    alter table public.universities rename to universities_legacy_uuid;
  end if;
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'comments') then
    alter table public.comments rename to comments_legacy_text_fk;
  end if;
end $$;

create table if not exists public.universities (
  id integer primary key,
  country text not null default 'kr',
  name_kr text not null default '',
  name_en text not null default '',
  logo text not null default '',
  continent text default '',
  address text default '',
  sort_order smallint not null default 99,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.university_departments (
  id integer primary key,
  univ_id integer not null references public.universities(id) on delete cascade,
  dept_name text not null default '',
  dept_name_en text not null default '',
  is_active boolean not null default true
);

create index if not exists idx_university_departments_univ on public.university_departments (univ_id);

create table if not exists public.admissions (
  id integer primary key,
  original_user_id integer not null default 0,
  user_handle text not null default '익명',
  year integer not null,
  year_end integer not null default 0,
  title text not null default '',
  input_score text not null default '',
  input_gpa text not null default '',
  input_specialty text not null default '',
  view_count integer not null default 0,
  likes_count integer not null default 0,
  is_verified boolean not null default false,
  is_featured boolean not null default false,
  published boolean not null default true,
  source text not null default 'mysql',
  created_at timestamptz not null default now()
);

create index if not exists idx_admissions_year on public.admissions (year);
create index if not exists idx_admissions_published on public.admissions (published);
create index if not exists idx_admissions_featured on public.admissions (is_featured desc, created_at desc);

create table if not exists public.admission_schools (
  id integer primary key,
  admission_id integer not null references public.admissions(id) on delete cascade,
  univ_id integer not null default 0,
  dept_id integer not null default 0,
  univ_name text not null default '',
  dept_name text not null default '',
  is_apply boolean not null default false,
  is_accept boolean not null default false,
  is_regist boolean not null default false,
  is_grad boolean not null default false,
  admission_type text not null default '',
  review text not null default '',
  thumbnail text not null default '',
  is_active boolean not null default true,
  created_at timestamptz
);

create index if not exists idx_admission_schools_admission on public.admission_schools (admission_id);
create index if not exists idx_admission_schools_regist on public.admission_schools (is_regist) where is_regist = true;

create table if not exists public.cross_comparisons (
  id integer primary key,
  admission_id integer not null references public.admissions(id) on delete cascade,
  univ_id_win integer not null default 0,
  univ_id_lose integer not null default 0,
  univ_name_win text not null default '',
  univ_name_lose text not null default '',
  dept_name_win text not null default '',
  dept_name_lose text not null default '',
  dept_id_win integer not null default 0,
  dept_id_lose integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz
);

create index if not exists idx_cross_univ_win on public.cross_comparisons (univ_id_win);
create index if not exists idx_cross_univ_lose on public.cross_comparisons (univ_id_lose);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  admission_id integer not null references public.admissions(id) on delete cascade,
  nickname text not null default '익명',
  password_hash text not null,
  content text not null,
  is_deleted boolean not null default false,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_comments_admission_int on public.comments (admission_id);

alter table public.universities enable row level security;
alter table public.university_departments enable row level security;
alter table public.admissions enable row level security;
alter table public.admission_schools enable row level security;
alter table public.cross_comparisons enable row level security;
alter table public.comments enable row level security;

drop policy if exists "universities read" on public.universities;
create policy "universities read" on public.universities for select using (is_active = true);

drop policy if exists "university_departments read" on public.university_departments;
create policy "university_departments read" on public.university_departments for select using (is_active = true);

drop policy if exists "admissions read" on public.admissions;
create policy "admissions read" on public.admissions for select using (published = true);

drop policy if exists "admission_schools read" on public.admission_schools;
create policy "admission_schools read" on public.admission_schools for select using (is_active = true);

drop policy if exists "cross_comparisons read" on public.cross_comparisons;
create policy "cross_comparisons read" on public.cross_comparisons for select using (is_active = true);

drop policy if exists "comments read" on public.comments;
create policy "comments read" on public.comments for select using (is_deleted = false);
