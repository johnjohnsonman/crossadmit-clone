-- Reddit-style forum: slugs, vote counts, comments, votes (Phase 2 ready)
-- Run in Supabase SQL Editor when ready.

ALTER TABLE study_korea_posts
  ADD COLUMN IF NOT EXISTS slug text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_study_korea_slug
  ON study_korea_posts(slug);

ALTER TABLE study_korea_posts
  ADD COLUMN IF NOT EXISTS upvotes_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS downvotes_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0;

ALTER TABLE study_korea_posts
  ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;

CREATE TABLE IF NOT EXISTS study_korea_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES study_korea_posts(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES study_korea_comments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  author_name text DEFAULT 'Anonymous',
  content text NOT NULL,
  upvotes_count integer DEFAULT 0,
  downvotes_count integer DEFAULT 0,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON study_korea_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON study_korea_comments(parent_id);

CREATE TABLE IF NOT EXISTS study_korea_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  post_id uuid REFERENCES study_korea_posts(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES study_korea_comments(id) ON DELETE CASCADE,
  vote_type smallint NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id),
  CHECK (vote_type IN (-1, 1)),
  CHECK ((post_id IS NULL) != (comment_id IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_votes_user ON study_korea_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_post ON study_korea_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_votes_comment ON study_korea_votes(comment_id);

ALTER TABLE study_korea_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read comments" ON study_korea_comments;
CREATE POLICY "Public read comments"
  ON study_korea_comments FOR SELECT
  USING (is_deleted = false);

DROP POLICY IF EXISTS "Authenticated insert comments" ON study_korea_comments;
CREATE POLICY "Authenticated insert comments"
  ON study_korea_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users update own comments" ON study_korea_comments;
CREATE POLICY "Users update own comments"
  ON study_korea_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE study_korea_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own votes" ON study_korea_votes;
CREATE POLICY "Users see own votes"
  ON study_korea_votes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own votes" ON study_korea_votes;
CREATE POLICY "Users insert own votes"
  ON study_korea_votes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own votes" ON study_korea_votes;
CREATE POLICY "Users update own votes"
  ON study_korea_votes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
