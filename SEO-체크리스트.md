# 구글 SEO 최적화 체크리스트

## ✅ 구현 완료된 항목

### 1. 메타데이터
- ✅ 기본 메타데이터 (title, description, keywords)
- ✅ Open Graph 태그 (소셜 미디어 공유 최적화)
- ✅ Twitter Card 태그
- ✅ 동적 메타데이터 (각 페이지별)

### 2. 구조화된 데이터 (JSON-LD)
- ✅ Organization 스키마
- ✅ WebSite 스키마 (검색 기능 포함)
- ✅ Article 스키마 (합격 DB 상세 페이지)
- ✅ StatisticalPopulation 스키마 (크로스어드밋 비교)

### 3. Sitemap
- ✅ `/sitemap.xml` 자동 생성
- ✅ 정적 페이지 포함
- ✅ 동적 페이지 자동 생성

### 4. Robots.txt
- ✅ `/robots.txt` 자동 생성
- ✅ 검색 엔진 크롤링 규칙 설정

### 5. 성능 최적화
- ✅ 이미지 최적화 설정
- ✅ 압축 활성화
- ✅ 불필요한 헤더 제거

## 🚀 배포 전 필수 작업

### 1. 도메인 설정
다음 파일들에서 `https://crossadmit.com`을 실제 도메인으로 변경:
- `app/sitemap.ts` (line 5)
- `app/robots.ts` (line 4)
- `app/layout.tsx` (여러 곳)
- `public/robots.txt` (line 11)

### 2. Google Search Console 설정
1. https://search.google.com/search-console 접속
2. 사이트 등록
3. `app/layout.tsx`의 `verification.google`에 인증 코드 추가:
```typescript
verification: {
  google: "your-google-verification-code",
},
```

### 3. Sitemap 제출
- Google Search Console에서 `https://yourdomain.com/sitemap.xml` 제출

### 4. OG 이미지 생성
- `/public/og-image.png` 파일 생성 (1200x630px 권장)
- 또는 각 페이지별 OG 이미지 생성

## 📊 배포 후 확인 사항

### 1. 메타데이터 확인
- [ ] 페이지 소스 보기에서 `<head>` 태그 확인
- [ ] Open Graph 태그 확인: https://www.opengraph.xyz/
- [ ] Twitter Card 확인: https://cards-dev.twitter.com/validator

### 2. 구조화된 데이터 확인
- [ ] Google Rich Results Test: https://search.google.com/test/rich-results
- [ ] 각 페이지의 구조화된 데이터 검증

### 3. Sitemap 확인
- [ ] `https://yourdomain.com/sitemap.xml` 접속 확인
- [ ] Google Search Console에서 크롤링 상태 확인

### 4. Robots.txt 확인
- [ ] `https://yourdomain.com/robots.txt` 접속 확인
- [ ] Google Search Console에서 테스트

### 5. 모바일 친화성
- [ ] Google Mobile-Friendly Test: https://search.google.com/test/mobile-friendly
- [ ] 반응형 디자인 확인

### 6. 페이지 속도
- [ ] Google PageSpeed Insights: https://pagespeed.web.dev/
- [ ] Lighthouse 점수 확인 (90점 이상 목표)

## 🔍 추가 권장 사항

### 1. Google Analytics 추가
```typescript
// app/layout.tsx에 추가
<script
  async
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
/>
```

### 2. Google Tag Manager 설정
- GTM 컨테이너 ID 추가

### 3. 소셜 미디어 링크
- `app/layout.tsx`의 `sameAs` 배열에 소셜 미디어 링크 추가

### 4. 콘텐츠 최적화
- 각 페이지에 고유한 H1 태그
- 이미지에 alt 텍스트 추가
- 내부 링크 구조 개선

## 📈 SEO 모니터링

### 정기적으로 확인할 항목
1. Google Search Console에서:
   - 인덱싱 상태
   - 검색 성능
   - 클릭률 (CTR)
   - 평균 순위

2. Google Analytics에서:
   - 유기적 트래픽
   - 이탈률
   - 체류 시간

3. 키워드 순위 추적:
   - "크로스어드밋"
   - "대학 선택 통계"
   - "서울대 연세대 비교"
   - "합격자 데이터베이스"

## 🎯 목표 키워드

### 주요 키워드
- 크로스어드밋
- 대학 선택 통계
- 서울대 연세대 비교
- 고려대 연세대 비교
- 합격자 데이터베이스

### 롱테일 키워드
- "서울대 연세대 동시 합격 선택"
- "고려대 연세대 어디가 나을까"
- "대학 합격 후기"
- "입시 데이터베이스"
- "대학 합격 통계"
