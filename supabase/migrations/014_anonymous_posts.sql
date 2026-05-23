-- Anonymous posting (DC/4chan style) — extends 013_reddit_style_features
-- Run in Supabase SQL Editor when ready.

ALTER TABLE study_korea_posts
  ADD COLUMN IF NOT EXISTS post_type text DEFAULT 'scraped',
  ADD COLUMN IF NOT EXISTS anonymous_nickname text,
  ADD COLUMN IF NOT EXISTS anonymous_password_hash text,
  ADD COLUMN IF NOT EXISTS author_ip_hash text,
  ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'auto_approved';

COMMENT ON COLUMN study_korea_posts.post_type IS 'scraped | user_anon | user_auth';
COMMENT ON COLUMN study_korea_posts.moderation_status IS 'pending | approved | rejected | auto_approved';

CREATE INDEX IF NOT EXISTS idx_posts_ip ON study_korea_posts(author_ip_hash);
CREATE INDEX IF NOT EXISTS idx_posts_moderation ON study_korea_posts(moderation_status);

ALTER TABLE study_korea_comments
  ADD COLUMN IF NOT EXISTS anonymous_nickname text DEFAULT 'Anonymous',
  ADD COLUMN IF NOT EXISTS anonymous_password_hash text,
  ADD COLUMN IF NOT EXISTS author_ip_hash text,
  ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'auto_approved';

CREATE TABLE IF NOT EXISTS rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  action text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ratelimit_ip
  ON rate_limit_log(ip_hash, action, created_at);

ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role rate_limit" ON rate_limit_log;
CREATE POLICY "Service role rate_limit"
  ON rate_limit_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read comments anon" ON study_korea_comments;
CREATE POLICY "Public read comments anon"
  ON study_korea_comments FOR SELECT
  USING (is_deleted = false AND moderation_status IN ('approved', 'auto_approved'));

DROP POLICY IF EXISTS "Anyone insert comments" ON study_korea_comments;
CREATE POLICY "Anyone insert comments"
  ON study_korea_comments FOR INSERT
  WITH CHECK (true);
