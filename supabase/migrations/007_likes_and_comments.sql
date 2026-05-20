-- 공감 수(별도 컬럼) + 피처드
-- admissions.id 타입은 text 입니다(UUID 아님). FK는 admission_id text로 매칭.

ALTER TABLE public.admissions
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.admissions
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

UPDATE public.admissions
SET likes_count = COALESCE(likes, likes_count);

-- DC 스타일 댓글
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id text NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
  nickname text NOT NULL DEFAULT '익명',
  password_hash text NOT NULL,
  content text NOT NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_admission_id ON public.comments (admission_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on comments"
  ON public.comments
  FOR SELECT
  USING (is_deleted = false);

CREATE POLICY "Allow anon insert comments"
  ON public.comments
  FOR INSERT TO anon
  WITH CHECK (true);
