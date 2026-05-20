-- 합격DB 확장: 공개 플래그, 후기 블록, 비자/어학 필드 (UI 및 추후 데이터 입수용)

alter table public.admissions add column if not exists published boolean not null default true;
alter table public.admissions add column if not exists pros text[];
alter table public.admissions add column if not exists cons text[];
alter table public.admissions add column if not exists tips text[];
alter table public.admissions add column if not exists summary text;
alter table public.admissions add column if not exists raw_content text;
alter table public.admissions add column if not exists visa_type text;
alter table public.admissions add column if not exists language_proficiency text;
alter table public.admissions add column if not exists topik_level text;

create index if not exists admissions_published_idx on public.admissions (published);
