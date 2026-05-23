-- Mentor view tracking: deduplicated view_count increments

CREATE TABLE IF NOT EXISTS mentor_view_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
  visitor_hash text NOT NULL,
  viewed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_view_log_mentor ON mentor_view_log(mentor_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_view_log_visitor ON mentor_view_log(visitor_hash, mentor_id, viewed_at);

ALTER TABLE mentor_view_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone insert view log" ON mentor_view_log
  FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION increment_mentor_view(
  p_mentor_id uuid,
  p_visitor_hash text
) RETURNS boolean AS $$
DECLARE
  recent_view_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM mentor_view_log
    WHERE mentor_id = p_mentor_id
      AND visitor_hash = p_visitor_hash
      AND viewed_at > now() - interval '1 hour'
  ) INTO recent_view_exists;

  IF recent_view_exists THEN
    RETURN false;
  END IF;

  INSERT INTO mentor_view_log (mentor_id, visitor_hash)
  VALUES (p_mentor_id, p_visitor_hash);

  UPDATE mentors SET view_count = view_count + 1 WHERE id = p_mentor_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_old_view_logs() RETURNS void AS $$
BEGIN
  DELETE FROM mentor_view_log WHERE viewed_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_mentor_view(uuid, text) TO anon, authenticated, service_role;
