-- university_tags 배열을 공백으로 이어 붙여 부분 검색(ilike)에 사용합니다.

ALTER TABLE public.university_videos
ADD COLUMN IF NOT EXISTS university_tags_search text
GENERATED ALWAYS AS (coalesce(array_to_string(university_tags, ' '), '')) STORED;
