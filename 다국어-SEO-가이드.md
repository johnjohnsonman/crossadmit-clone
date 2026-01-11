# 다국어 SEO 가이드 (Multilingual SEO Guide)

## 🌍 지원 언어

- 한국어 (ko) - 기본 언어
- 영어 (en) - English
- 중국어 간체 (zh-CN) - 简体中文
- 중국어 번체 (zh-TW) - 繁體中文
- 스페인어 (es) - Español
- 일본어 (ja) - 日本語

## ✅ 구현된 다국어 SEO 기능

### 1. hreflang 태그
- 각 페이지에 언어별 대체 링크 추가
- 검색 엔진이 언어별 페이지를 인식하도록 설정
- `x-default` 태그로 기본 언어 지정

### 2. 다국어 메타데이터
- Title, Description에 다국어 키워드 포함
- Open Graph 태그에 `alternateLocale` 추가
- 각 언어별 키워드 최적화

### 3. 구조화된 데이터 (JSON-LD)
- `alternateName` 속성으로 다국어 이름 추가
- `inLanguage` 속성으로 지원 언어 명시
- `description`에 다국어 설명 포함

### 4. Sitemap 다국어 지원
- 각 페이지에 `alternates.languages` 추가
- 검색 엔진이 언어별 페이지를 크롤링할 수 있도록 설정

## 📝 주요 키워드 (Target Keywords)

### 영어 (English)
- "study in Korea"
- "Korean university admission"
- "Korea university comparison"
- "SNU vs Yonsei"
- "Korea University vs Yonsei"
- "university admission statistics"
- "Korean higher education"
- "admission to Korean universities"

### 중국어 간체 (简体中文)
- "留学韩国"
- "韩国大学"
- "大学录取统计"
- "首尔大学"
- "延世大学"
- "高丽大学"
- "交叉录取"
- "韩国留学申请"

### 중국어 번체 (繁體中文)
- "留學韓國"
- "韓國大學"
- "大學錄取統計"
- "首爾大學"
- "延世大學"
- "高麗大學"

### 스페인어 (Español)
- "estudiar en Corea"
- "universidad coreana"
- "admisión universitaria"
- "estadísticas de admisión"
- "estudiar en Seúl"

### 일본어 (日本語)
- "韓国留学"
- "韓国の大学"
- "大学入学統計"
- "ソウル大学"
- "延世大学"
- "高麗大学"

## 🚀 다국어 페이지 구현 (선택사항)

현재는 메타데이터와 구조화된 데이터에만 다국어를 포함했습니다. 
실제 다국어 페이지를 만들려면:

### 1. Next.js i18n 라우팅 설정
```typescript
// next.config.js
const nextConfig = {
  i18n: {
    locales: ['ko', 'en', 'zh-CN', 'zh-TW', 'es', 'ja'],
    defaultLocale: 'ko',
  },
}
```

### 2. 언어별 페이지 생성
- `/en/crossadmit` - 영어 버전
- `/zh/crossadmit` - 중국어 간체 버전
- `/zh-tw/crossadmit` - 중국어 번체 버전
- `/es/crossadmit` - 스페인어 버전
- `/ja/crossadmit` - 일본어 버전

### 3. 번역 파일 관리
- `locales/ko.json`
- `locales/en.json`
- `locales/zh-CN.json`
- 등등...

## 📊 검색 엔진별 최적화

### Google
- ✅ hreflang 태그로 언어별 페이지 연결
- ✅ 구조화된 데이터로 다국어 콘텐츠 표시
- ✅ Google Search Console에서 언어별 인덱싱 확인

### Baidu (중국)
- ✅ 중국어 키워드 최적화
- ✅ 중국어 메타데이터
- ✅ Baidu Webmaster Tools 등록 권장

### Naver (한국)
- ✅ 한국어 기본 최적화
- ✅ Naver Search Advisor 등록

### Yandex (러시아)
- ✅ 영어 버전으로 러시아 사용자 타겟팅 가능

## 🔍 다국어 SEO 체크리스트

### 배포 전
- [ ] 각 언어별 hreflang 태그 확인
- [ ] 다국어 메타데이터 검증
- [ ] 구조화된 데이터에 다국어 포함 확인
- [ ] Sitemap에 언어별 URL 포함 확인

### 배포 후
- [ ] Google Search Console에서 언어별 인덱싱 확인
- [ ] 각 언어로 검색했을 때 노출 확인
- [ ] hreflang 태그 검증: https://www.google.com/webmasters/tools/i18n
- [ ] 다국어 키워드 순위 추적

## 📈 다국어 콘텐츠 전략

### 1. 지역별 타겟팅
- **중국**: "留学韩国", "首尔大学" 등 인기 키워드
- **미국/영국**: "study in Korea", "Korean universities"
- **스페인어권**: "estudiar en Corea", "universidad coreana"
- **일본**: "韓国留学", "ソウル大学"

### 2. 콘텐츠 현지화
- 각 언어권의 검색 습관 고려
- 문화적 차이 반영
- 지역별 인기 대학 강조

### 3. 링크 빌딩
- 각 언어권의 교육 포럼에 링크
- 유학 관련 블로그와 협력
- 소셜 미디어 다국어 마케팅

## 🎯 우선순위

### 1단계 (즉시 적용)
- ✅ 다국어 메타데이터
- ✅ hreflang 태그
- ✅ 구조화된 데이터 다국어 지원

### 2단계 (단기)
- [ ] 실제 다국어 페이지 구현
- [ ] 언어 선택 UI 추가
- [ ] 번역 파일 관리 시스템

### 3단계 (장기)
- [ ] 지역별 SEO 최적화
- [ ] 다국어 콘텐츠 마케팅
- [ ] 지역별 파트너십
