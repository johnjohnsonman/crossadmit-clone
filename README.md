# 크로스어드밋 클론 프로젝트

crossadmit.com을 기반으로 한 합격자 데이터베이스 플랫폼입니다.

## 주요 기능

### 1. 데이터 수집 및 자동 업로드
- **웹 스크래핑**: crossadmit.com에서 합격자 데이터 자동 수집
- **Supabase 저장**: 합격자 데이터를 PostgreSQL(Supabase)에 영구 저장
- **자동 스케줄러**: 매일 자정에 데이터 수집 (Vercel Cron 마이그레이션 예정)

### 2. 학교별 페이지
각 학교별로 다음 정보를 제공합니다:
- **게시판**: 학교 관련 포럼 게시글
- **유명 동문**: 학교 출신 유명 인물
- **합격 DB**: 해당 학교의 합격자 데이터
- **학교 사진**: 캠퍼스 사진 갤러리

### 3. 메인 기능
- 떠다니는 합격자 DB 배너
- 복수 합격자의 대학 선택 정보
- 인기 포럼
- 합격후기
- 커넥팅 (실제 합격자와 직접 만나보기)
- 세계대학 목록

## 환경변수 설정

Supabase와 Vercel 배포를 위해 로컬 환경변수를 설정합니다.

1. `.env.local.example`을 복사해 `.env.local`을 만듭니다.
2. [Supabase 대시보드](https://supabase.com/dashboard) → 프로젝트 → **Settings → API**에서 값을 복사해 채웁니다.

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon(public) 키 — 브라우저·서버 클라이언트용 |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 측정 ID (`G-XXXXXXXXXX`) |
| `NEXT_PUBLIC_GSC_VERIFICATION` | Google Search Console 사이트 검증 코드 |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role 키 — 마이그레이션 스크립트 등 서버 전용 (절대 클라이언트에 노출 금지) |

```bash
cp .env.local.example .env.local
# .env.local 파일을 편집해 실제 값 입력
```

`.env.local`은 Git에 커밋되지 않습니다 (`.gitignore` 참고).

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 데이터 수집 (수동)
npm run scrape

# JSON → Supabase 마이그레이션 (source=generated 제외)
npm run migrate

# 스케줄러 실행 (로컬, 레거시)
npm run scheduler
```

## Vercel 배포

1. [Vercel](https://vercel.com)에서 GitHub 저장소를 Import합니다.
2. **Environment Variables**에 다음을 등록합니다:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_GA_ID`
   - `NEXT_PUBLIC_GSC_VERIFICATION`
   - `SUPABASE_SERVICE_ROLE_KEY` (서버/API 전용)
3. Framework Preset: **Next.js** (자동 감지)
4. Deploy 후 제공된 URL로 접속합니다.

로컬에서 Supabase에 데이터를 올린 뒤 배포하는 것을 권장합니다 (`npm run migrate`).

> 이전 Render 배포 가이드는 `docs/_archive/`에 보관되어 있습니다.

## 프로젝트 구조

```
├── app/
│   ├── api/
│   │   ├── admissions/     # 합격자 데이터 API (Supabase)
│   │   └── cron/           # Vercel Cron 엔드포인트 (예정)
│   ├── universities/
│   │   └── [name]/         # 학교별 동적 페이지
│   └── page.tsx            # 메인 페이지
├── lib/
│   └── supabase/           # Supabase 클라이언트 및 타입
├── components/
│   ├── university/         # 학교별 컴포넌트
│   └── ...                 # 공통 컴포넌트
├── scripts/
│   ├── scraper.ts          # 웹 스크래핑
│   ├── migrate-to-supabase.ts  # JSON → Supabase 마이그레이션
│   └── scheduler.ts        # 자동 스케줄러 (레거시)
└── data/                   # 레거시 JSON 데이터 (마이그레이션 소스)
```

## 데이터 형식

운영 데이터는 Supabase `admissions` 테이블에 저장됩니다. 마이그레이션 소스는 `data/all-admissions.json`입니다.

```json
{
  "id": "unique-id",
  "university": "서울대학교",
  "universityEn": "Seoul National University",
  "major": "경제학과",
  "year": 2024,
  "admissionType": "정시",
  "status": "합격",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "source": "web"
}
```

### API 쿼리 파라미터 (`GET /api/admissions`)

| 파라미터 | 설명 |
|----------|------|
| `university` | 대학명 부분 일치 검색 |
| `year` | 입학 연도 |
| `source` | 데이터 출처 (`web` 등) |
| `nationality` | 국적 필터 |
| `limit` / `offset` | 페이지네이션 (지정 시 `{ data, total, limit, offset }` 반환) |

## 기술 스택

- **Next.js 16**: React 프레임워크
- **TypeScript**: 타입 안정성
- **Tailwind CSS**: 스타일링
- **Supabase**: PostgreSQL 데이터베이스
- **Vercel**: 호스팅 및 Cron (예정)
- **Cheerio**: 웹 스크래핑
- **node-cron**: 로컬 스케줄링 (레거시)

## 라이선스

ISC
