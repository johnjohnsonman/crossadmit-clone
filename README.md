# 크로스어드밋 클론 프로젝트

crossadmit.com을 기반으로 한 합격자 데이터베이스 플랫폼입니다.

## 주요 기능

### 1. 데이터 수집 및 자동 업로드
- **웹 스크래핑**: crossadmit.com에서 합격자 데이터 자동 수집
- **가상 데이터 생성**: 매일 5-10개의 가상 합격자 데이터 생성
- **자동 스케줄러**: 매일 자정에 자동으로 데이터 수집 및 업로드

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

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 데이터 수집 (수동)
npm run scrape

# 가상 데이터 생성 (수동)
npm run generate

# 스케줄러 실행 (자동 업로드)
npm run scheduler
```

## 프로젝트 구조

```
├── app/
│   ├── api/
│   │   └── admissions/     # 합격자 데이터 API
│   ├── universities/
│   │   └── [name]/         # 학교별 동적 페이지
│   └── page.tsx            # 메인 페이지
├── components/
│   ├── university/         # 학교별 컴포넌트
│   └── ...                 # 공통 컴포넌트
├── scripts/
│   ├── scraper.ts          # 웹 스크래핑
│   ├── crossadmitScraper.ts # crossadmit.com 스크래퍼
│   ├── dataGenerator.ts    # 가상 데이터 생성
│   └── scheduler.ts        # 자동 스케줄러
└── data/                   # 수집된 데이터 저장소
```

## 데이터 형식

합격자 데이터는 `data/all-admissions.json`에 저장됩니다.

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
  "source": "web" | "generated"
}
```

## 기술 스택

- **Next.js 16**: React 프레임워크
- **TypeScript**: 타입 안정성
- **Tailwind CSS**: 스타일링
- **Cheerio**: 웹 스크래핑
- **node-cron**: 스케줄링

## 라이선스

ISC


