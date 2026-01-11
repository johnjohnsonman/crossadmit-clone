# Render 배포 가이드

## 1. GitHub에 코드 푸시

먼저 프로젝트를 GitHub 저장소에 푸시해야 합니다.

```bash
# Git 초기화 (아직 안 했다면)
git init

# 모든 파일 추가
git add .

# 커밋
git commit -m "Initial commit for Render deployment"

# GitHub 저장소 생성 후
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## 2. Render에서 새 웹 서비스 생성

1. [Render 대시보드](https://dashboard.render.com)에 로그인
2. "New +" 버튼 클릭
3. "Web Service" 선택
4. GitHub 저장소 연결
5. 다음 설정 입력:

### 기본 설정
- **Name**: `crossadmit-clone` (원하는 이름)
- **Environment**: `Node`
- **Region**: `Singapore` (또는 가장 가까운 지역)
- **Branch**: `main` (또는 기본 브랜치)

### 빌드 설정
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 환경 변수
현재는 특별한 환경 변수가 필요하지 않지만, 필요시 추가할 수 있습니다:
- `NODE_ENV=production`

## 3. 배포 확인

1. Render가 자동으로 빌드 시작
2. 빌드 로그 확인 (약 5-10분 소요)
3. 배포 완료 후 제공되는 URL로 접속 테스트

## 4. 자동 배포 설정

- **Auto-Deploy**: `Yes` (기본값)
  - GitHub에 푸시할 때마다 자동으로 재배포됩니다

## 5. 데이터 디렉토리 주의사항

⚠️ **중요**: Render는 파일 시스템이 임시적입니다. 
- `data/` 폴더의 JSON 파일은 배포 시 초기화될 수 있습니다
- 프로덕션에서는 데이터베이스(PostgreSQL, MongoDB 등) 사용을 권장합니다

### 임시 해결책
1. 초기 데이터를 `data/` 폴더에 포함시켜 배포
2. 또는 Render의 디스크 스토리지를 사용 (유료 플랜)

## 6. 커스텀 도메인 설정 (선택사항)

1. Render 대시보드에서 서비스 선택
2. "Settings" → "Custom Domains"
3. 도메인 추가 및 DNS 설정

## 7. 모니터링

- **Logs**: 실시간 로그 확인 가능
- **Metrics**: CPU, 메모리 사용량 모니터링
- **Alerts**: 오류 발생 시 알림 설정

## 문제 해결

### 빌드 실패
- `package.json`의 의존성 확인
- Node.js 버전 확인 (Render는 자동으로 감지)
- 빌드 로그에서 오류 메시지 확인

### 런타임 오류
- 환경 변수 확인
- 로그에서 스택 트레이스 확인
- `data/` 폴더 접근 권한 확인

### 성능 최적화
- Next.js 이미지 최적화 활용
- 정적 파일 CDN 사용
- 데이터베이스 연결 풀링

## 추가 리소스

- [Render 공식 문서](https://render.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
