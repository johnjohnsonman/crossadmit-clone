-- 선택 실행: pending 합격 후기 중 한국인 입시 후기만 자동 거부
-- Supabase SQL Editor에서 한 번 실행 (백업 권장)

UPDATE study_korea_posts
SET
  is_admission_post = false,
  moderation_status = 'rejected_korean_domestic'
WHERE
  is_admission_post = true
  AND moderation_status = 'pending'
  AND (
    title ~* '수능|수시|정시|학종|논술|진학사|칸수'
    OR content ~* '수능|수시|정시|학종|논술|진학사|칸수'
  )
  AND NOT (
    title ~* 'GKS|international|foreign|외국인|TOPIK|유학|留学|du học'
    OR content ~* 'GKS|international|foreign|외국인|TOPIK|유학|留学|du học'
  );
