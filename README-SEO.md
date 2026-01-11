# SEO 최적화 가이드

## 구현된 SEO 기능

### 1. 메타데이터 (Metadata)
- ✅ 기본 메타데이터 (title, description, keywords)
- ✅ Open Graph 태그 (소셜 미디어 공유)
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
- ✅ 동적 페이지 자동 생성 (합격 DB, 크로스어드밋, 포럼)

### 4. Robots.txt
- ✅ `/robots.txt` 자동 생성
- ✅ 검색 엔진 크롤링 규칙 설정

## 배포 전 체크리스트

### 1. 도메인 설정
```typescript
// app/sitemap.ts, app/robots.ts, app/layout.tsx에서
const baseUrl = "https://crossadmit.com"; // 실제 도메인으로 변경
```

### 2. Google Search Console 설정
1. Google Search Console에 사이트 등록
2. `app/layout.tsx`의 `verification.google`에 인증 코드 추가
3. Sitemap 제출: `https://crossadmit.com/sitemap.xml`

### 3. OG 이미지 생성
- `/public/og-image.png` 파일 생성 (1200x630px)
- 또는 각 페이지별 OG 이미지 생성

### 4. 성능 최적화
- 이미지 최적화 (Next.js Image 컴포넌트 사용)
- 코드 스플리팅 확인
- Lighthouse 점수 확인

### 5. 추가 권장 사항
- Google Analytics 추가
- Google Tag Manager 설정
- 소셜 미디어 링크 추가 (layout.tsx의 sameAs)

## 배포 후 확인 사항

1. **Sitemap 확인**
   - `https://yourdomain.com/sitemap.xml` 접속 확인
   - Google Search Console에 제출

2. **Robots.txt 확인**
   - `https://yourdomain.com/robots.txt` 접속 확인

3. **구조화된 데이터 확인**
   - Google Rich Results Test: https://search.google.com/test/rich-results
   - 각 페이지의 구조화된 데이터 검증

4. **메타데이터 확인**
   - 페이지 소스 보기에서 `<head>` 태그 확인
   - Open Graph 태그 확인: https://www.opengraph.xyz/

5. **모바일 친화성**
   - Google Mobile-Friendly Test 실행
   - 반응형 디자인 확인

## 키워드 전략

### 주요 키워드
- 크로스어드밋
- 대학 선택 통계
- 서울대 연세대 비교
- 고려대 연세대 비교
- 합격자 데이터베이스
- 입시 정보
- 대학 합격 통계

### 롱테일 키워드
- "서울대 연세대 동시 합격 선택"
- "고려대 연세대 어디가 나을까"
- "대학 합격 후기"
- "입시 데이터베이스"

## 콘텐츠 최적화 팁

1. **제목 최적화**: 각 페이지마다 고유하고 설명적인 제목
2. **메타 설명**: 150-160자, 클릭을 유도하는 설명
3. **헤딩 구조**: H1, H2, H3 적절히 사용
4. **내부 링크**: 관련 페이지로 자연스러운 링크
5. **이미지 alt 텍스트**: 모든 이미지에 설명 추가
