-- 공감 수(별도 컬럼) + 피처드
-- comments.admission_id FK는 프로젝트별로 admissions.id가 uuid 또는 text일 수 있음 → 아래 DO 블록에서 자동 선택

ALTER TABLE public.admissions
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.admissions
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- 일부 DB에는 `likes` 컬럼이 없음 → 있을 때만 likes_count로 이전
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admissions'
      AND column_name = 'likes'
  ) THEN
    UPDATE public.admissions
    SET likes_count = COALESCE(likes, likes_count);
  END IF;
END $$;

-- DC 스타일 댓글 (admissions.id 타입에 맞춤 — uuid 프로젝트에서 text FK 시 42804 발생)
DO $$
DECLARE
  id_type text;
BEGIN
  SELECT c.data_type INTO STRICT id_type
  FROM information_schema.columns AS c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'admissions'
    AND c.column_name = 'id';

  IF id_type = 'uuid' THEN
    EXECUTE $sql$
      CREATE TABLE IF NOT EXISTS public.comments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        admission_id uuid NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
        nickname text NOT NULL DEFAULT '익명',
        password_hash text NOT NULL,
        content text NOT NULL,
        is_deleted boolean NOT NULL DEFAULT false,
        ip_hash text,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    $sql$;
  ELSIF id_type IN ('text', 'character varying') THEN
    EXECUTE $sql$
      CREATE TABLE IF NOT EXISTS public.comments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        admission_id text NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
        nickname text NOT NULL DEFAULT '익명',
        password_hash text NOT NULL,
        content text NOT NULL,
        is_deleted boolean NOT NULL DEFAULT false,
        ip_hash text,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    $sql$;
  ELSE
    RAISE EXCEPTION 'Unsupported public.admissions.id type: % (need uuid or text)', id_type;
  END IF;
END $$;

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
