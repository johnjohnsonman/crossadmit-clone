-- AI Knowledge Hub: factual guides (distinct from scraped / user posts)

ALTER TABLE study_korea_posts
  ADD COLUMN IF NOT EXISTS is_ai_generated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_sources jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_last_updated timestamptz,
  ADD COLUMN IF NOT EXISTS ai_content_kr text DEFAULT '';

CREATE TABLE IF NOT EXISTS ai_guide_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_title text NOT NULL,
  category text NOT NULL,
  priority integer DEFAULT 5,
  keywords text[] DEFAULT '{}',
  reference_urls text[] DEFAULT '{}',
  status text DEFAULT 'pending',
  generated_post_id uuid REFERENCES study_korea_posts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  generated_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_topics_status ON ai_guide_topics(status, priority DESC);

-- Seed topics (only when table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM ai_guide_topics LIMIT 1) THEN
    INSERT INTO ai_guide_topics (topic_title, category, priority, keywords) VALUES
    ('D-2 Student Visa Complete Application Guide', 'visa', 10, ARRAY['d-2 visa', 'student visa korea', 'visa application']),
    ('D-4 Language Visa: Requirements and Process', 'visa', 10, ARRAY['d-4 visa', 'language visa', 'topik']),
    ('GKS Korean Government Scholarship Complete Guide 2026', 'scholarship', 10, ARRAY['gks scholarship', 'korean government scholarship', 'kgsp']),
    ('How to Apply to Seoul National University as International Student', 'admission', 9, ARRAY['snu admission', 'seoul national university', 'international student']),
    ('Yonsei University International Admissions Guide', 'admission', 9, ARRAY['yonsei admission', 'international student']),
    ('Monthly Living Cost in Seoul for International Students', 'living_cost', 9, ARRAY['seoul living cost', 'student budget', 'monthly expenses']),
    ('TOPIK Exam: Complete Preparation Guide', 'language', 8, ARRAY['topik', 'korean proficiency test', 'topik preparation']),
    ('Opening a Bank Account in Korea as a Foreigner', 'settlement', 8, ARRAY['korean bank account', 'foreigner bank', 'wooribank']),
    ('Getting Mobile Phone Plan in Korea: International Student Guide', 'settlement', 8, ARRAY['korean phone plan', 'sim card korea', 'skt kt lgu']),
    ('Korean University Dormitory: What to Expect', 'dormitory', 7, ARRAY['korean dorm', 'university housing', 'dormitory']),
    ('Off-Campus Housing in Seoul: Finding Apartments', 'dormitory', 7, ARRAY['seoul apartment', 'goshiwon', 'student housing']),
    ('Working Part-Time as International Student in Korea', 'employment', 7, ARRAY['part-time job korea', 'student work permit', 'alba']),
    ('Korean Health Insurance for International Students', 'settlement', 8, ARRAY['korean health insurance', 'nhis', 'foreigner insurance']),
    ('Public Transportation in Seoul: T-money and Apps', 'culture', 6, ARRAY['seoul subway', 't-money card', 'kakao taxi']),
    ('Korean Food on Student Budget: Where to Eat', 'culture', 6, ARRAY['korean food', 'cheap restaurants seoul', 'student meal']);
  END IF;
END $$;
