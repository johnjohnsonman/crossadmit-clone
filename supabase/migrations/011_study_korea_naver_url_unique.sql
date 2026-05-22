-- Naver: prevent duplicate rows for the same article URL per source

-- Remove existing URL duplicates (keep oldest row per source+url)
DELETE FROM study_korea_posts a
USING study_korea_posts b
WHERE a.source IN ('naver_blog', 'naver_news')
  AND b.source = a.source
  AND a.url <> ''
  AND b.url = a.url
  AND a.id <> b.id
  AND a.created_at > b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_study_korea_source_url
  ON study_korea_posts (source, url)
  WHERE url IS NOT NULL AND url <> '';
