-- 사용자 제출(익명 후기)용 필드

alter table public.admissions add column if not exists verified boolean not null default false;
alter table public.admissions add column if not exists student_handle text;
alter table public.admissions add column if not exists topik_grade smallint;

comment on column public.admissions.verified is '관리자 검증 여부';
comment on column public.admissions.student_handle is '사용자 표시 닉네임(익명 제출)';
comment on column public.admissions.topik_grade is 'TOPIK 급수 1–6, 없음은 null';
