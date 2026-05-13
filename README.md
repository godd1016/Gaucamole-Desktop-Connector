# GuacDesktop

Apache Guacamole 원격 데스크탑 클라이언트 (Electron 데스크탑 앱)

## 시작하기

### 요구사항
- Node.js 18 이상
- Apache Guacamole 서버 (Docker로 실행 중)

### 개발 모드 실행

```powershell
npm install
npm run dev
```

### 프로덕션 빌드

```powershell
npm run build
```

### Windows 설치 파일 생성

```powershell
npm run dist
```
`release/` 폴더에 NSIS 설치 파일이 생성됩니다.

## 사용 방법

1. 앱 실행 후 과콰몰리 서버 URL 입력
   - 예: `http://192.168.1.100:8080/guacamole`
2. 과콰몰리 계정으로 로그인
3. 연결 목록에서 원하는 연결 클릭
4. 앱 내에서 원격 세션 실행

## 단축키 (세션 중)

- 마우스를 상단으로 이동 → 툴바 표시
- 전체화면 토글 버튼 (툴바)
- 연결 해제 버튼 (툴바)

## 기술 스택

- Electron 31
- React 18 + TypeScript
- Vite 5
- guacamole-common-js
- Tailwind CSS
- Zustand
