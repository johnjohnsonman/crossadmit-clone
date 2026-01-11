# Render 배포 가이드

## 빠른 시작

### 1단계: GitHub에 코드 푸시

```bash
# Git 초기화 (아직 안 했다면)
git init
git add .
git commit -m "Ready for Render deployment"

# GitHub 저장소 생성 후
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 2단계: Render에서 배포

1. [Render 대시보드](https://dashboard.render.com) 접속
2. "New +" → "Web Service" 클릭
3. GitHub 저장소 연결
4. 다음 설정 입력:

#### 필수 설정
- **Name**: `crossadmit-clone`
- **Environment**: `Node`
- **Region**: `Singapore` (또는 가장 가까운 지역)
- **Branch**: `main`

#### 빌드 & 시작 명령어
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

#### 환경 변수
- `NODE_ENV=production` (자동 설정됨)

### 3단계: 배포 완료

- 빌드 시간: 약 5-10분
- 배포 완료 후 Render가 제공하는 URL로 접속
- 예: `https://crossadmit-clone.onrender.com`

## 중요 사항

### 데이터 파일 관리

⚠️ **주의**: Render의 파일 시스템은 임시적입니다.

현재 프로젝트는 `data/` 폴더에 JSON 파일로 데이터를 저장합니다:
- `data/all-admissions.json` - 합격 데이터
- `data/crossadmit.json` - 크로스어드밋 데이터

**문제점**: 
- 서버 재시작 시 데이터가 사라질 수 있음
- 여러 인스턴스 간 데이터 공유 불가

**해결 방법**:

1. **임시 해결책** (초기 배포용):
   - 초기 데이터를 `data/` 폴더에 포함시켜 배포
   - `.gitignore`에서 `data/*.json` 주석 처리

2. **장기 해결책** (권장):
   - Render PostgreSQL 데이터베이스 추가
   - 또는 MongoDB Atlas 같은 외부 DB 사용
   - 데이터베이스 마이그레이션 필요

### 자동 배포

- GitHub에 푸시하면 자동으로 재배포됩니다
- "Auto-Deploy" 설정 확인

### 커스텀 도메인

1. Render 대시보드 → 서비스 선택
2. "Settings" → "Custom Domains"
3. 도메인 추가 및 DNS 설정

## 문제 해결

### 빌드 실패
- `package.json` 확인
- Node.js 버전 확인 (Render는 자동 감지)
- 빌드 로그 확인

### 런타임 오류
- 환경 변수 확인
- 로그 확인 (Render 대시보드)
- `data/` 폴더 접근 권한 확인

### 성능 최적화
- Next.js 이미지 최적화 활용
- 정적 파일 CDN 사용
- 데이터베이스 연결 풀링

## 다음 단계

1. ✅ Render에 배포 완료
2. 🔄 데이터베이스 마이그레이션 (선택)
3. 🔄 커스텀 도메인 설정 (선택)
4. 🔄 모니터링 및 알림 설정

## 추가 리소스

- [Render 공식 문서](https://render.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
