-- International admissions page URLs per university

ALTER TABLE universities
  ADD COLUMN IF NOT EXISTS intl_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS intl_url_verified boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_universities_intl_verified
  ON universities (intl_url_verified)
  WHERE intl_url_verified = true;

-- Seed major universities (run after migration; adjust name_kr if your rows differ)
UPDATE universities SET intl_url = 'https://en.snu.ac.kr/apply/info', intl_url_verified = true WHERE name_kr = '서울대학교';
UPDATE universities SET intl_url = 'https://admission.kaist.ac.kr/intl-graduate/', intl_url_verified = true WHERE name_kr LIKE '%KAIST%';
UPDATE universities SET intl_url = 'https://www.yonsei.ac.kr/en_sc/admission/ug_foreign.jsp', intl_url_verified = true WHERE name_kr = '연세대학교(서울캠)';
UPDATE universities SET intl_url = 'https://oia.korea.ac.kr/english/programs/inbound', intl_url_verified = true WHERE name_kr = '고려대학교(서울캠)';
UPDATE universities SET intl_url = 'https://www.skku.edu/eng/Admission/index.do', intl_url_verified = true WHERE name_kr = '성균관대학교';
UPDATE universities SET intl_url = 'https://www.hanyang.ac.kr/web/eng/international_student', intl_url_verified = true WHERE name_kr = '한양대학교';
UPDATE universities SET intl_url = 'https://intl.khu.ac.kr/eng/html/intl/admission/undergraduate.jsp', intl_url_verified = true WHERE name_kr = '경희대학교(서울캠)';
UPDATE universities SET intl_url = 'https://admission.cau.ac.kr/foreigner/main.do', intl_url_verified = true WHERE name_kr = '중앙대학교';
UPDATE universities SET intl_url = 'https://ibsi.ewha.ac.kr/eng/admissions/index.html', intl_url_verified = true WHERE name_kr = '이화여자대학교';
UPDATE universities SET intl_url = 'https://iie.sogang.ac.kr/iie/en/', intl_url_verified = true WHERE name_kr = '서강대학교';
UPDATE universities SET intl_url = 'https://oia.konkuk.ac.kr/oia/en/', intl_url_verified = true WHERE name_kr = '건국대학교(서울캠)';
UPDATE universities SET intl_url = 'https://www.unist.ac.kr/admission/international/', intl_url_verified = true WHERE name_kr LIKE '%UNIST%';
UPDATE universities SET intl_url = 'https://admission.postech.ac.kr/international/', intl_url_verified = true WHERE name_kr = '포항공과대학교';
UPDATE universities SET intl_url = 'https://www.gist.ac.kr/en/html/sub07/', intl_url_verified = true WHERE name_kr LIKE '%GIST%';
