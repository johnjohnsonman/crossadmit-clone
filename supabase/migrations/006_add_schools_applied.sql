-- 다중 지원 학교·결과 (크로스어드밋형 데이터)
-- 참고: 저장소에 이미 003_university_videos_tags_search.sql 가 있어 파일명은 006 사용

alter table public.admissions add column if not exists schools_applied jsonb default '[]'::jsonb;

create index if not exists idx_admissions_schools_applied on public.admissions using gin (schools_applied);
